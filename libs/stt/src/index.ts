import { Socket, io as SocketIO } from "socket.io-client";

export const SDK_VERSION = "0.1.0";

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
    console.log(`AiolaStreamingClient SDK Version: ${SDK_VERSION}`);
  }

  private buildEndpoint(): string {
    const { baseUrl, namespace, queryParams } = this.config;
    const queryString = new URLSearchParams(queryParams).toString();
    return `${baseUrl}${namespace}${queryString ? `?${queryString}` : ""}`;
  }

  public async startStreaming(): Promise<void> {
    const io = getIO();
    const { bearer, transports, events, micConfig } = this.config;
    const _bearer = `Bearer ${bearer}`;
    const _transports =
      transports === "polling"
        ? ["polling"]
        : transports === "websocket"
        ? ["polling", "websocket"]
        : ["polling", "websocket"];
    this.socket = io(this.buildEndpoint(), {
      path: "/api/voice-streaming/socket.io",
      transports: _transports,
      extraHeaders: {
        Authorization: _bearer,
      },
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

    this.socket.on("connect_error", (error) =>
      console.error("Socket connection error:", error)
    );
    this.socket.on("transcript", events.onTranscript);
    this.socket.on("events", events.onEvents);

    try {
      await this.startMicStreaming(micConfig);
    } catch (error) {
      console.error("Error starting microphone:", error);
      throw error;
    }
  }

  private async startMicStreaming({
    sampleRate,
    chunkSize,
    channels,
  }: AiolaConfig["micConfig"]): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    this.audioContext = new AudioContext({ sampleRate });
    this.micSource = this.audioContext.createMediaStreamSource(
      this.mediaStream
    );

    await this.audioContext.audioWorklet.addModule("./audio-processor.js");

    const audioWorkletNode = new AudioWorkletNode(
      this.audioContext,
      "audio-processor",
      {
        processorOptions: { chunkSize },
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
    console.log("Microphone streaming started");
  }

  public stopStreaming(): void {
    if (this.micSource) this.micSource.disconnect();
    if (this.mediaStream) {
      const tracks = this.mediaStream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    if (this.socket) this.socket.disconnect();
    console.log("Streaming stopped");
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

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16Array[i] = Math.min(1, Math.max(-1, float32Array[i])) * 32767;
    }
    return int16Array;
  }
}
