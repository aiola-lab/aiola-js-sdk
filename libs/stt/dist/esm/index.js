var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const getIO = () => {
    if (typeof window !== "undefined" && window.io) {
        return window.io;
    }
    // For Node.js environment
    return require("socket.io-client").io;
};
export class AiolaStreamingClient {
    constructor(config) {
        this.socket = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.micSource = null;
        this.activeKeywords = [];
        // Set default micConfig values if not provided
        this.config = Object.assign(Object.assign({}, config), { micConfig: Object.assign({ sampleRate: 16000, chunkSize: 4096, channels: 1 }, (config.micConfig || {})) });
    }
    /**
     * Handle error by logging it and emitting the error event
     * @param message Error message
     * @param code Error code
     * @param details Additional error details
     */
    handleError(message, code = AiolaSocketErrorCode.GENERAL_ERROR, details) {
        var _a, _b;
        const error = new AiolaSocketError(message, code, details);
        console.error(error.toString());
        (_b = (_a = this.config.events).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
    }
    /**
     * Get the currently active keywords
     * @returns The array of active keywords
     */
    getActiveKeywords() {
        return [...this.activeKeywords];
    }
    /**
     * Connect to the aiOla streaming service
     */
    connect() {
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
                this.handleError("Failed to initialize socket connection", AiolaSocketErrorCode.NETWORK_ERROR);
                return;
            }
            this.socket.on("connect", () => {
                var _a;
                console.log("Socket connected");
                (_a = events.onConnect) === null || _a === void 0 ? void 0 : _a.call(events);
                // If there are active keywords, resend them on reconnection
                if (this.activeKeywords.length > 0) {
                    this.setKeywords(this.activeKeywords);
                }
            });
            this.socket.on("error", (error) => {
                console.error("Socket error:", error);
                this.handleError(`Socket error: ${error.message}`, AiolaSocketErrorCode.GENERAL_ERROR, { originalError: error });
            });
            this.socket.on("connect_error", (error) => {
                console.error("Socket connection error:", error);
                this.handleError(`Socket connection error: ${error.message}`, AiolaSocketErrorCode.NETWORK_ERROR, { originalError: error });
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
                this.handleError("Socket is not connected. Please call connect first.", AiolaSocketErrorCode.MIC_ERROR);
                return;
            }
            console.log("Starting microphone recording");
            const { micConfig } = this.config;
            try {
                (_c = (_b = this.config.events).onStartRecord) === null || _c === void 0 ? void 0 : _c.call(_b);
                this.mediaStream = yield navigator.mediaDevices
                    .getUserMedia({
                    audio: true,
                })
                    .catch((error) => {
                    var _a, _b;
                    this.handleError(`Failed to access microphone: ${error.message}`, AiolaSocketErrorCode.MIC_ERROR, { originalError: error });
                    (_b = (_a = this.config.events).onStopRecord) === null || _b === void 0 ? void 0 : _b.call(_a);
                    return null;
                });
                if (!this.mediaStream) {
                    return;
                }
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
                this.handleError(`Error starting microphone recording: ${error instanceof Error ? error.message : "Unknown error"}`, AiolaSocketErrorCode.MIC_ERROR, { originalError: error });
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
        catch (error) {
            this.handleError(`Error stopping microphone recording: ${error instanceof Error ? error.message : "Unknown error"}`, AiolaSocketErrorCode.MIC_ERROR, { originalError: error });
        }
        finally {
            (_b = (_a = this.config.events).onStopRecord) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
    }
    /**
     * Set keywords for speech recognition
     * @param keywords Array of keywords to listen for
     * @throws {AiolaSocketError} If keywords are invalid or if there's an error setting them
     */
    setKeywords(keywords) {
        console.log("setKeywords called with:", keywords);
        if (!keywords || !Array.isArray(keywords)) {
            throw new AiolaSocketError("Keywords must be a valid array", AiolaSocketErrorCode.KEYWORDS_ERROR);
        }
        const validKeywords = keywords
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
        if (validKeywords.length === 0) {
            throw new AiolaSocketError("At least one valid keyword must be provided", AiolaSocketErrorCode.KEYWORDS_ERROR);
        }
        // Store the keywords immediately, they will be the active set whether connected or not
        this.activeKeywords = validKeywords;
        if (!this.socket || !this.socket.connected) {
            console.log("Connection not established. Socket status:", this.socket ? "socket exists but not connected" : "socket is null", "Keywords will be sent when connected.");
            return;
        }
        try {
            const binaryData = new TextEncoder().encode(JSON.stringify(validKeywords));
            console.log("Socket is connected, preparing to emit keywords");
            console.log("Emitting set_keywords event with keywords:", validKeywords);
            this.socket.emit("set_keywords", binaryData, (ack) => {
                var _a, _b;
                if (ack === null || ack === void 0 ? void 0 : ack.error) {
                    console.error("Server returned error:", ack.error);
                    this.handleError(`Server error: ${ack.error}`, AiolaSocketErrorCode.KEYWORDS_ERROR);
                    return;
                }
                if ((ack === null || ack === void 0 ? void 0 : ack.status) === "received") {
                    console.log("Keywords successfully sent:", validKeywords);
                    (_b = (_a = this.config.events).onKeyWordSet) === null || _b === void 0 ? void 0 : _b.call(_a, validKeywords);
                }
            });
            // Listen for server errors
            this.socket.once("error", (error) => {
                console.error("Socket error:", error);
                this.handleError(`Socket error: ${error.message || "Unknown error"}`, AiolaSocketErrorCode.KEYWORDS_ERROR);
            });
        }
        catch (error) {
            this.handleError(`Error emitting keywords: ${error instanceof Error ? error.message : "Unknown error"}`, AiolaSocketErrorCode.KEYWORDS_ERROR, { originalError: error });
            throw error;
        }
    }
    //---- Private methods ----//
    buildEndpoint() {
        return `${this.config.baseUrl}${this.config.namespace}`;
    }
    buildPath() {
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
export var AiolaSocketNamespace;
(function (AiolaSocketNamespace) {
    AiolaSocketNamespace["EVENTS"] = "/events";
})(AiolaSocketNamespace || (AiolaSocketNamespace = {}));
/**
 * Custom error codes for aiOla SDK errors
 */
export var AiolaSocketErrorCode;
(function (AiolaSocketErrorCode) {
    AiolaSocketErrorCode["INVALID_CONFIGURATION"] = "INVALID_CONFIGURATION";
    AiolaSocketErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    AiolaSocketErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    AiolaSocketErrorCode["KEYWORDS_ERROR"] = "KEYWORDS_ERROR";
    AiolaSocketErrorCode["MIC_ERROR"] = "MIC_ERROR";
    AiolaSocketErrorCode["STREAMING_ERROR"] = "STREAMING_ERROR";
    AiolaSocketErrorCode["GENERAL_ERROR"] = "GENERAL_ERROR";
})(AiolaSocketErrorCode || (AiolaSocketErrorCode = {}));
/**
 * Custom error class for aiOla SDK
 */
export class AiolaSocketError extends Error {
    constructor(message, code = AiolaSocketErrorCode.GENERAL_ERROR, details) {
        super(message);
        this.name = "AiolaError";
        this.code = code;
        this.details = details;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, AiolaSocketError.prototype);
    }
    /**
     * Creates a string representation of the error including the error code
     */
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
    /**
     * Creates a plain object representation of the error
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            stack: this.stack,
        };
    }
}
