export const SDK_VERSION = "0.1.0";

interface TTSConfig {
  baseUrl: string;
  bearer: string;
  defaultVoice?: string;
}

export default class AiolaTTSClient {
  private config: TTSConfig;

  constructor(config: TTSConfig) {
    this.config = config;
    console.log(`AiolaTTSClient SDK Version: ${SDK_VERSION}`);
  }

  public async synthesizeSpeech(
    text: string,
    voice?: string
  ): Promise<ArrayBuffer> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for synthesis");
    }

    const payload = { text, voice };
    return await this.request("synthesize", payload);
  }

  public async streamSpeech(
    text: string,
    voice?: string
  ): Promise<ReadableStream<Uint8Array>> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for synthesis");
    }

    const payload = { text, voice };
    return await this.request("synthesize/stream", payload);
  }

  /**
   * Helper method to make API requests.
   * @param {string} endpoint - The API endpoint to call.
   * @param {Object} data - The payload for the request.
   * @returns {Promise<Object>} - The API response.
   */
  async request(endpoint: string, data: any) {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/tts/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${this.config.bearer}`,
          },
          body: new URLSearchParams(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail ||
            `TTS ${endpoint.split("/")[0]} failed: ${response.statusText}`
        );
      }

      if (endpoint === "synthesize") {
        if (response.headers.get("Content-Type")?.includes("audio/wav")) {
          return await response.blob();
        }
        throw new Error("Invalid response type for synthesis");
      } else if (endpoint === "synthesize/stream") {
        if (!response.body) {
          throw new Error("Response body is null");
        }
        return response.body;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  public getVoices(): Record<string, string> {
    return {
      Default: "af",
      Bella: "af_bella",
      Nicole: "af_nicole",
      Sarah: "af_sarah",
      Sky: "af_sky",
      Adam: "am_adam",
      Michael: "am_michael",
      Emma: "bf_emma",
      Isabella: "bf_isabella",
      George: "bm_george",
      Lewis: "bm_lewis",
    };
  }
}
