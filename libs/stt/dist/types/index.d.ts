export declare const SDK_VERSION = "0.1.0";
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
export declare class AiolaStreamingClient {
    private socket;
    private audioContext;
    private mediaStream;
    private micSource;
    private config;
    constructor(config: AiolaConfig);
    private buildEndpoint;
    startStreaming(): Promise<void>;
    private startMicStreaming;
    stopStreaming(): void;
    setKeywords(keywords: string[]): void;
    private float32ToInt16;
}
export {};
