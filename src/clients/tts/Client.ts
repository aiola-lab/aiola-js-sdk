import { TtsRequest } from "../../lib/types";
import { AiolaError } from "../../lib/errors";
import { AbstractClient } from "../AbstractClient";

/**
 * Text-to-Speech (TTS) client for converting text to spoken audio.
 * 
 * Provides methods for both streaming and complete synthesis of text to speech.
 * The audio is returned as a ReadableStream for efficient handling of potentially
 * large audio files.
 */
export class Tts extends AbstractClient {
  /**
   * Synthesizes text to speech with streaming delivery.
   * 
   * Returns audio as it's generated, providing lower latency than the synthesize method.
   * Ideal for real-time applications where you want to start playing audio as soon
   * as the first chunks are available.
   * 
   * The audio format is typically WAV or MP3, depending on server configuration.
   * 
   * @param requestOptions - Text-to-speech request configuration
   * @param requestOptions.text - The text to convert to speech (required)
   * @param requestOptions.voiceId - Voice identifier. Supported voices:
   *   - 'en_us_female', 'en_us_male' - English (US)
   *   - 'es_female', 'es_male' - Spanish
   *   - 'fr_female', 'fr_male' - French
   *   - 'de_female', 'de_male' - German
   *   - 'ja_female', 'ja_male' - Japanese
   *   - 'pt_female', 'pt_male' - Portuguese
   * 
   * @returns A ReadableStream of audio data chunks
   * 
   * @throws {AiolaError} If the request fails or response has no body
   * 
   * @example
   * ```typescript
   * // Stream synthesis for real-time playback
   * const audioStream = await client.tts.stream({ 
   *   text: 'Hello, welcome to Aiola!',
   *   voiceId: 'en-US-JennyNeural'
   * });
   * 
   * // In browser: play audio as it streams
   * const mediaSource = new MediaSource();
   * const audio = new Audio(URL.createObjectURL(mediaSource));
   * 
   * // In Node.js: pipe to file or speaker
   * const reader = audioStream.getReader();
   * while (true) {
   *   const { done, value } = await reader.read();
   *   if (done) break;
   *   // Process audio chunk (value)
   * }
   * ```
   */
  public async stream(
    requestOptions: TtsRequest,
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await this.fetch("/api/tts/stream", {
        method: "POST",
        body: JSON.stringify(requestOptions),
        headers: {
          Accept: "audio/*",
        },
      });

      if (!response.body) {
        throw await AiolaError.fromResponse(response);
      }

      return response.body;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Synthesizes text to speech with complete generation.
   * 
   * Waits for the complete audio to be generated before starting to return data.
   * Use this when you need the complete audio file, or when you want to ensure
   * the entire synthesis is successful before proceeding.
   * 
   * The audio format is typically WAV or MP3, depending on server configuration.
   * 
   * @param requestOptions - Text-to-speech request configuration
   * @param requestOptions.text - The text to convert to speech (required)
   * @param requestOptions.voiceId - Voice identifier. Supported voices:
   *   - 'en_us_female', 'en_us_male' - English (US)
   *   - 'es_female', 'es_male' - Spanish
   *   - 'fr_female', 'fr_male' - French
   *   - 'de_female', 'de_male' - German
   *   - 'ja_female', 'ja_male' - Japanese
   *   - 'pt_female', 'pt_male' - Portuguese
   * 
   * @returns A ReadableStream of audio data
   * 
   * @throws {AiolaError} If the request fails or response has no body
   * 
   * @example
   * ```typescript
   * // Synthesize complete audio
   * const audioStream = await client.tts.synthesize({ 
   *   text: 'This is a longer text that will be fully synthesized before streaming begins.',
   *   voiceId: 'en-GB-RyanNeural'
   * });
   * 
   * // Convert stream to blob (browser)
   * const response = new Response(audioStream);
   * const audioBlob = await response.blob();
   * const audioUrl = URL.createObjectURL(audioBlob);
   * const audio = new Audio(audioUrl);
   * audio.play();
   * 
   * // Save to file (Node.js)
   * const fs = require('fs');
   * const reader = audioStream.getReader();
   * const chunks = [];
   * while (true) {
   *   const { done, value } = await reader.read();
   *   if (done) break;
   *   chunks.push(value);
   * }
   * fs.writeFileSync('output.wav', Buffer.concat(chunks));
   * ```
   */
  public async synthesize(
    requestOptions: TtsRequest,
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await this.fetch("/api/tts/synthesize", {
        method: "POST",
        body: JSON.stringify(requestOptions),
        headers: {
          Accept: "audio/*",
        },
      });

      if (!response.body) {
        throw await AiolaError.fromResponse(response);
      }

      return response.body;
    } catch (err) {
      throw err;
    }
  }
}
