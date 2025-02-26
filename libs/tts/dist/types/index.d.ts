export declare const SDK_VERSION = "0.1.0";
interface TTSConfig {
    baseUrl: string;
    bearer: string;
    defaultVoice?: string;
}
export default class AiolaTTSClient {
    private config;
    constructor(config: TTSConfig);
    synthesizeSpeech(text: string, voice?: string): Promise<ArrayBuffer>;
    streamSpeech(text: string, voice?: string): Promise<ReadableStream<Uint8Array>>;
}
export {};
