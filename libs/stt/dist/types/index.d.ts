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
export declare class AiolaStreamingClient {
    private socket;
    private audioContext;
    private mediaStream;
    private micSource;
    private config;
    constructor(config: AiolaConfig);
    openSocket(): Promise<void>;
    closeSocket(): void;
    startRecording(): Promise<void>;
    stopRecording(): void;
    setKeywords(keywords: string[]): void;
    private buildEndpoint;
    private buildPath;
    private float32ToInt16;
}
export {};
