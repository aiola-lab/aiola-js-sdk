/**
 * aiOla Text-to-Speech Client SDK
 * Version: 0.1.0
 */

export default class AiolaTTSClient {
    /**
     * @param {string} baseUrl - The base URL for the TTS API.
     */
    constructor(baseUrl, bearerToken) {
      if (!baseUrl) {
        throw new Error("baseUrl is required");
      }
      if (!bearerToken) {
        throw new Error("bearerToken is required");
      }
      this.baseUrl = baseUrl;
      this.bearerToken = bearerToken;
    }
  
    /**
     * Helper method to make API requests.
     * @param {string} endpoint - The API endpoint to call.
     * @param {Object} data - The payload for the request.
     * @returns {Promise<Object>} - The API response.
     */
    async request(endpoint, data) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${this.bearerToken}`,
          },
          body: new URLSearchParams(data),
        });
  
        if (response.ok) {
          if (response.headers.get("Content-Type")?.includes("audio/wav")) {
            return await response.blob(); // Return audio data as Blob
          }
          return await response.json(); // Return JSON response
        } else {
          const error = await response.json();
          throw new Error(error.detail || `Request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
        throw error;
      }
    }
  
    /**
     * Convert text to speech and retrieve the audio file.
     * @param {string} text - The text to convert to speech.
     * @param {string} [voice="af_bella"] - The voice to use for synthesis.
     * @returns {Promise<Blob>} - The generated audio file as a Blob.
     */
    async synthesize(text, voice = "af_bella") {
      if (!text || text.trim().length === 0) {
        throw new Error("Text is required for synthesis");
      }
  
      const payload = { text, voice };
      return await this.request("/synthesize", payload);
    }
  
    /**
     * Convert text to speech and stream the audio data.
     * @param {string} text - The text to convert to speech.
     * @param {string} [voice="af_bella"] - The voice to use for synthesis.
     * @returns {Promise<Blob>} - The generated audio stream as a Blob.
     */
    async synthesizeStream(text, voice = "af_bella") {
      if (!text || text.trim().length === 0) {
        throw new Error("Text is required for synthesis");
      }
  
      const payload = { text, voice };
      return await this.request("/synthesize/stream", payload);
    }
  }