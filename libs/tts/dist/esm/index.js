export const SDK_VERSION = "0.1.0";
export default class AiolaTTSClient {
    constructor(config) {
        this.config = config;
        console.log(`AiolaTTSClient SDK Version: ${SDK_VERSION}`);
    }
    async synthesizeSpeech(text, voice) {
        const response = await fetch(`${this.config.baseUrl}/api/tts/synthesize`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: this.config.bearer,
            },
            body: JSON.stringify({
                text,
                voice: voice || this.config.defaultVoice,
            }),
        });
        if (!response.ok) {
            throw new Error(`TTS synthesis failed: ${response.statusText}`);
        }
        return response.arrayBuffer();
    }
    async streamSpeech(text, voice) {
        const response = await fetch(`${this.config.baseUrl}/api/tts/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: this.config.bearer,
            },
            body: JSON.stringify({
                text,
                voice: voice || this.config.defaultVoice,
            }),
        });
        if (!response.ok) {
            throw new Error(`TTS streaming failed: ${response.statusText}`);
        }
        if (!response.body) {
            throw new Error("Response body is null");
        }
        return response.body;
    }
}
