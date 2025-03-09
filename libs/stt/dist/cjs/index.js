"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiolaStreamingClient = void 0;
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
    }
    openSocket() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Opening socket connection");
            const io = getIO();
            const { bearer, transports, events } = this.config;
            const _bearer = `Bearer ${bearer}`;
            const _transports = transports === "polling"
                ? ["polling"]
                : transports === "websocket"
                    ? ["websocket"]
                    : ["polling", "websocket"];
            this.socket = io(this.buildEndpoint(), {
                withCredentials: true,
                path: this.buildPath(),
                query: Object.assign({}, this.config.queryParams),
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
                var _a;
                console.log("Socket connected");
                (_a = events.onConnect) === null || _a === void 0 ? void 0 : _a.call(events);
            });
            this.socket.on("connect_error", (error) => {
                var _a;
                console.error("Socket connection error:", error);
                (_a = events.onError) === null || _a === void 0 ? void 0 : _a.call(events, error);
            });
            this.socket.on("transcript", events.onTranscript);
            this.socket.on("events", events.onEvents);
        });
    }
    closeSocket() {
        console.log("Closing socket connection");
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        console.log("Socket connection closed");
    }
    startRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!((_a = this.socket) === null || _a === void 0 ? void 0 : _a.connected)) {
                throw new Error("Socket is not connected. Please call openSocket first.");
            }
            console.log("Starting microphone recording");
            const { micConfig } = this.config;
            try {
                (_c = (_b = this.config.events).onStartRecord) === null || _c === void 0 ? void 0 : _c.call(_b);
                this.mediaStream = yield navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                this.audioContext = new AudioContext({
                    sampleRate: micConfig.sampleRate,
                });
                this.micSource = this.audioContext.createMediaStreamSource(this.mediaStream);
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
                yield this.audioContext.audioWorklet.addModule(url);
                const audioWorkletNode = new AudioWorkletNode(this.audioContext, "audio-processor", {
                    processorOptions: { chunkSize: micConfig.chunkSize },
                });
                audioWorkletNode.port.onmessage = (event) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const chunk = event.data;
                        const int16Array = this.float32ToInt16(chunk);
                        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.emit("binary_data", int16Array.buffer);
                    }
                    catch (error) {
                        console.error("Error processing chunk:", error);
                    }
                });
                this.micSource.connect(audioWorkletNode);
                console.log("Microphone recording started");
            }
            catch (error) {
                (_e = (_d = this.config.events).onStopRecord) === null || _e === void 0 ? void 0 : _e.call(_d);
                throw error;
            }
        });
    }
    stopRecording() {
        var _a, _b;
        console.log("Stopping microphone recording");
        try {
            if (this.micSource)
                this.micSource.disconnect();
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
        }
        finally {
            (_b = (_a = this.config.events).onStopRecord) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
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
    //---- Private methods ----//
    buildEndpoint() {
        // const { /*baseUrl, namespace,*/ queryParams } = this.config;
        // const queryString = queryParams
        //   ? new URLSearchParams(queryParams).toString()
        //   : "";
        // return `${baseUrl}${namespace}/events${queryString}`;
        return `https://api-testing.internal.aiola.ai/events`;
    }
    buildPath() {
        // const { namespace } = this.config;
        return `/api/voice-streaming/socket.io`;
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
