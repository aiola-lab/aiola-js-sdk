import { Socket } from "socket.io-client";

interface AiolaConfig {
  baseUrl: string;
  namespace: string;
  bearer: string;
  queryParams: Record<string, string>;
  micConfig: {
    sampleRate: number;
    chunkSize: number;
    channels: number;
  };
  events: {
    onTranscript: (data: any) => void;
    onEvents: (data: any) => void;
    onConnect?: () => void;
    onError?: (error: Error) => void;
    onStartRecord?: () => void;
    onStopRecord?: () => void;
  };
  transports?: "polling" | "websocket" | "all";
}

// Handle both Node.js and browser environments
declare const window: any;
const getIO = () => {
  if (typeof window !== "undefined" && window.io) {
    return window.io;
  }
  // For Node.js environment
  return require("socket.io-client").io;
};

export class AiolaStreamingClient {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private config: AiolaConfig;

  constructor(config: AiolaConfig) {
    this.config = config;
  }

  public async openSocket(): Promise<void> {
    console.log("Opening socket connection");
    const io = getIO();
    const { bearer, transports, events } = this.config;
    const _bearer = `Bearer ${bearer}`;
    const _transports =
      transports === "polling"
        ? ["polling"]
        : transports === "websocket"
        ? ["websocket"]
        : ["polling", "websocket"];

    this.socket = io(this.buildEndpoint(), {
      withCredentials: true,
      path: this.buildPath(),
      query: {
        ...this.config.queryParams,
      },
      transports: _transports,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transportOptions: {
        polling: {
          extraHeaders: { Authorization: _bearer },
        },
        websocket: {
          extraHeaders: { Authorization: _bearer },
        },
      },
    });

    if (!this.socket) {
      throw new Error("Failed to initialize socket connection");
    }

    this.socket.on("connect", () => {
      console.log("Socket connected");
      events.onConnect?.();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      events.onError?.(error);
    });

    this.socket.on("transcript", events.onTranscript);
    this.socket.on("events", events.onEvents);
  }

  public closeSocket(): void {
    console.log("Closing socket connection");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log("Socket connection closed");
  }

  public async startRecording(): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error("Socket is not connected. Please call openSocket first.");
    }

    console.log("Starting microphone recording");
    const { micConfig } = this.config;
    try {
      this.config.events.onStartRecord?.();

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.audioContext = new AudioContext({
        sampleRate: micConfig.sampleRate,
      });
      this.micSource = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );

      const processorCode = `
        class AudioProcessor extends AudioWorkletProcessor {
          constructor(options) {
            super();
            this.chunkSize = options.processorOptions.chunkSize;
            this.buffer = new Float32Array(this.chunkSize);
            this.bufferIndex = 0;
          }

          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (!input || !input[0]) return true;

            const channel = input[0];
            for (let i = 0; i < channel.length; i++) {
              this.buffer[this.bufferIndex] = channel[i];
              this.bufferIndex++;

              if (this.bufferIndex >= this.chunkSize) {
                this.port.postMessage(this.buffer);
                this.bufferIndex = 0;
              }
            }

            return true;
          }
        }

        registerProcessor("audio-processor", AudioProcessor);
      `;

      const blob = new Blob([processorCode], {
        type: "application/javascript",
      });
      const url = URL.createObjectURL(blob);

      await this.audioContext.audioWorklet.addModule(url);

      const audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        "audio-processor",
        {
          processorOptions: { chunkSize: micConfig.chunkSize },
        }
      );

      audioWorkletNode.port.onmessage = async (event: MessageEvent) => {
        try {
          const chunk = event.data;
          const int16Array = this.float32ToInt16(chunk);
          this.socket?.emit("binary_data", int16Array.buffer);
        } catch (error) {
          console.error("Error processing chunk:", error);
        }
      };

      this.micSource.connect(audioWorkletNode);
      console.log("Microphone recording started");
    } catch (error) {
      this.config.events.onStopRecord?.();
      throw error;
    }
  }

  public stopRecording(): void {
    console.log("Stopping microphone recording");
    try {
      if (this.micSource) this.micSource.disconnect();
      if (this.mediaStream) {
        const tracks = this.mediaStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (this.audioContext) {
        this.audioContext.close();
      }
      this.micSource = null;
      this.mediaStream = null;
      this.audioContext = null;
      console.log("Microphone recording stopped");
    } finally {
      this.config.events.onStopRecord?.();
    }
  }

  public setKeywords(keywords: string[]): void {
    if (!this.socket?.connected) {
      console.error("Socket is not connected. Unable to send keywords.");
      return;
    }

    try {
      const binaryData = JSON.stringify(keywords);
      this.socket.emit(
        "set_keywords",
        binaryData,
        (ack: { status: string }) => {
          if (ack?.status === "received") {
            console.log("Keywords successfully sent.");
          } else {
            console.warn("Failed to receive acknowledgment for keywords.");
          }
        }
      );
    } catch (error) {
      console.error("Error emitting keywords:", error);
      throw error;
    }
  }

  //---- Private methods ----//

  private buildEndpoint(): string {
    // const { /*baseUrl, namespace,*/ queryParams } = this.config;
    // const queryString = queryParams
    //   ? new URLSearchParams(queryParams).toString()
    //   : "";
    // return `${baseUrl}${namespace}/events${queryString}`;
    return `https://api-testing.internal.aiola.ai/events`;
  }

  private buildPath(): string {
    // const { namespace } = this.config;
    return `/api/voice-streaming/socket.io`;
  }

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16Array[i] = Math.min(1, Math.max(-1, float32Array[i])) * 32767;
    }
    return int16Array;
  }
}
