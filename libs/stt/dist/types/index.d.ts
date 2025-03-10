export declare class AiolaStreamingClient {
    private socket;
    private audioContext;
    private mediaStream;
    private micSource;
    private config;
    private activeKeywords;
    constructor(config: AiolaSocketConfig);
    /**
     * Handle error by logging it and emitting the error event
     * @param message Error message
     * @param code Error code
     * @param details Additional error details
     */
    private handleError;
    /**
     * Get the currently active keywords
     * @returns The array of active keywords
     */
    getActiveKeywords(): string[];
    /**
     * Connect to the aiOla streaming service
     */
    connect(): Promise<void>;
    closeSocket(): void;
    startRecording(): Promise<void>;
    stopRecording(): void;
    /**
     * Set keywords for speech recognition
     * @param keywords Array of keywords to listen for
     * @throws {AiolaSocketError} If keywords are invalid or if there's an error setting them
     */
    setKeywords(keywords: string[]): void;
    private buildEndpoint;
    private buildPath;
    private float32ToInt16;
}
/**
 * Configuration for the aiOla streaming client
 */
export interface AiolaSocketConfig {
    baseUrl: string;
    namespace: AiolaSocketNamespace;
    bearer: string;
    queryParams: Record<string, string>;
    micConfig?: {
        sampleRate: number;
        chunkSize: number;
        channels: number;
    };
    events: {
        onTranscript: (data: any) => void;
        onEvents: (data: any) => void;
        onConnect?: () => void;
        onStartRecord?: () => void;
        onStopRecord?: () => void;
        onKeyWordSet?: (keywords: string[]) => void;
        onError?: (error: AiolaSocketError) => void;
    };
    transports?: "polling" | "websocket" | "all";
}
export declare enum AiolaSocketNamespace {
    EVENTS = "/events"
}
/**
 * Custom error codes for aiOla SDK errors
 */
export declare enum AiolaSocketErrorCode {
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
    NETWORK_ERROR = "NETWORK_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    KEYWORDS_ERROR = "KEYWORDS_ERROR",
    MIC_ERROR = "MIC_ERROR",
    STREAMING_ERROR = "STREAMING_ERROR",
    GENERAL_ERROR = "GENERAL_ERROR"
}
/**
 * Custom error class for aiOla SDK
 */
export declare class AiolaSocketError extends Error {
    readonly code: AiolaSocketErrorCode;
    readonly details?: Record<string, any>;
    constructor(message: string, code?: AiolaSocketErrorCode, details?: Record<string, any>);
    /**
     * Creates a string representation of the error including the error code
     */
    toString(): string;
    /**
     * Creates a plain object representation of the error
     */
    toJSON(): Record<string, any>;
}
