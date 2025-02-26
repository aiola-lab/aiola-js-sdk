import { io as SocketIO } from "socket.io-client";
export const SDK_VERSION = "0.1.0";
export default class AiolaStreamingClient {
    constructor(config) {
        this.socket = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.micSource = null;
        this.config = config;
        console.log(`AiolaStreamingClient SDK Version: ${SDK_VERSION}`);
    }
    buildEndpoint() {
        const { baseUrl, namespace, queryParams } = this.config;
        const queryString = new URLSearchParams(queryParams).toString();
        return `${baseUrl}${namespace}?${queryString}`;
    }
    async startStreaming() {
        const endpoint = this.buildEndpoint();
        const { bearer, micConfig, events, transports } = this.config;
        const _transports = transports === "polling"
            ? ["polling"]
            : transports === "websocket"
                ? ["polling", "websocket"]
                : ["polling", "websocket"];
        // Set the cookie with SameSite=None to allow third-party context
        const domain = new URL(this.config.baseUrl).hostname;
        document.cookie = `Auth-Socket=${this.config.bearer}; path=/; domain=${domain}; Secure; SameSite=None`;
        this.socket = SocketIO(endpoint, {
            transports: _transports,
            withCredentials: false,
            path: "/api/voice-streaming/socket.io",
            extraHeaders: {
                Authorization: bearer,
            },
            transportOptions: {
                polling: {
                    extraHeaders: { Authorization: bearer },
                },
                websocket: {
                    extraHeaders: { Authorization: bearer },
                },
            },
        });
        this.socket.on("connect", () => console.log("Socket connected"));
        this.socket.on("disconnect", () => console.log("Socket disconnected"));
        this.socket.on("connect_error", (error) => console.error("Socket connection error:", error));
        this.socket.on("transcript", events.onTranscript);
        this.socket.on("events", events.onEvents);
        try {
            await this.startMicStreaming(micConfig);
        }
        catch (error) {
            console.error("Error starting microphone:", error);
            throw error;
        }
    }
    async startMicStreaming({ sampleRate, chunkSize, channels, }) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        this.audioContext = new AudioContext({ sampleRate });
        this.micSource = this.audioContext.createMediaStreamSource(this.mediaStream);
        const processorCode = `
      class InlineAudioProcessor extends AudioWorkletProcessor {
        private chunkSize: number;
        private buffer: Float32Array;
        private processingPromise: Promise<void>;

        constructor(options: AudioWorkletNodeOptions) {
          super();
          this.chunkSize = options.processorOptions?.chunkSize || 4096;
          this.buffer = new Float32Array();
          this.processingPromise = Promise.resolve();
        }

        async waitForPreviousChunk(): Promise<void> {
          await this.processingPromise;
        }

        async processChunk(chunk: Float32Array): Promise<void> {
          this.processingPromise = new Promise((resolve) => {
            this.port.postMessage(chunk);
            resolve();
          });
        }

        process(inputs: Float32Array[][]): boolean {
          const input = inputs[0];
          if (input && input[0]) {
            const audioData = input[0];
            const newBuffer = new Float32Array(this.buffer.length + audioData.length);
            newBuffer.set(this.buffer);
            newBuffer.set(audioData, this.buffer.length);
            this.buffer = newBuffer;

            if (this.buffer.length >= this.chunkSize) {
              const chunk = this.buffer.slice(0, this.chunkSize);
              this.buffer = this.buffer.slice(this.chunkSize);
              this.waitForPreviousChunk();
              this.processChunk(chunk);
            }
          }
          return true;
        }
      }

      registerProcessor('audio-processor', InlineAudioProcessor);
    `;
        const blob = new Blob([processorCode], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(url);
        const audioWorkletNode = new AudioWorkletNode(this.audioContext, "audio-processor", {
            processorOptions: { chunkSize },
        });
        audioWorkletNode.port.onmessage = async (event) => {
            var _a;
            try {
                const chunk = event.data;
                const int16Array = this.float32ToInt16(chunk);
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.emit("binary_data", int16Array.buffer);
            }
            catch (error) {
                console.error("Error processing chunk:", error);
            }
        };
        this.micSource.connect(audioWorkletNode);
        console.log("Microphone streaming started");
    }
    async generateHash(arrayBuffer) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }
    stopStreaming() {
        if (this.micSource)
            this.micSource.disconnect();
        if (this.mediaStream) {
            const tracks = this.mediaStream.getTracks();
            tracks.forEach((track) => track.stop());
        }
        if (this.socket)
            this.socket.disconnect();
        console.log("Streaming stopped");
    }
    setKeywords(keywords) {
        var _a;
        if (!((_a = this.socket) === null || _a === void 0 ? void 0 : _a.connected)) {
            console.error("Socket is not connected. Unable to send keywords.");
            return;
        }
        try {
            const binaryData = JSON.stringify(keywords);
            this.socket.emit("set_keywords", binaryData, (ack) => {
                if ((ack === null || ack === void 0 ? void 0 : ack.status) === "received") {
                    console.log("Keywords successfully sent.");
                }
                else {
                    console.warn("Failed to receive acknowledgment for keywords.");
                }
            });
        }
        catch (error) {
            console.error("Error emitting keywords:", error);
            throw error;
        }
    }
    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            int16Array[i] = Math.min(1, Math.max(-1, float32Array[i])) * 32767;
        }
        return int16Array;
    }
}
