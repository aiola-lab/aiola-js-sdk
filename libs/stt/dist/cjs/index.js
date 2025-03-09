"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiolaStreamingClient = exports.SDK_VERSION = void 0;
exports.SDK_VERSION = "0.1.0";
const getIO = () => {
    if (typeof window !== "undefined" && window.io) {
        return window.io;
    }
    // For Node.js environment
    return require("socket.io-client").io;
};
class AiolaStreamingClient {
    constructor(config) {
        this.socket = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.micSource = null;
        this.config = config;
        console.log(`AiolaStreamingClient SDK Version: ${exports.SDK_VERSION}`);
    }
    buildEndpoint() {
        const { baseUrl, namespace, queryParams } = this.config;
        const queryString = new URLSearchParams(queryParams).toString();
        return `${baseUrl}${namespace}${queryString ? `?${queryString}` : ""}`;
    }
    async startStreaming() {
        const io = getIO();
        this.socket = io(this.buildEndpoint(), {
            extraHeaders: {
                Authorization: `Bearer ${this.config.bearer}`,
            },
        });
        if (!this.socket) {
            throw new Error("Failed to initialize socket connection");
        }
        this.socket.on("connect_error", (error) => console.error("Socket connection error:", error));
        this.socket.on("transcript", this.config.events.onTranscript);
        this.socket.on("events", this.config.events.onEvents);
        try {
            await this.startMicStreaming(this.config.micConfig);
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
        await this.audioContext.audioWorklet.addModule("./audio-processor.js");
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
exports.AiolaStreamingClient = AiolaStreamingClient;
