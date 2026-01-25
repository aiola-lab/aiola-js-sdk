import { nanoid } from "nanoid";
import {
  TranscribeFileRequest,
  TranscribeFileResponse,
  SttStreamRequest,
  QueryAndHeaders,
} from "../../lib/types";
import { AbstractClient } from "../AbstractClient";
import { AiolaError } from "../../lib/errors";
import { StreamingClient } from "./streaming";
import FormData from "form-data";
import { DEFAULT_WORKFLOW_ID } from "../../lib/constants";
import { prepareFileForFormData } from "../../lib/files";
import { RUNTIME } from "../../lib/runtime";

/**
 * Speech-to-Text (STT) client for audio transcription services.
 * 
 * Provides both file-based transcription and real-time streaming capabilities.
 * Supports multiple audio formats (WAV, MP3, M4A, OGG, FLAC) and various AI tasks.
 */
export class Stt extends AbstractClient {
  private readonly path = "/api/voice-streaming/socket.io";
  private readonly namespace = "/events";

  /**
   * Helper method to append optional form fields to FormData
   * Accepts both Node.js form-data and browser native FormData
   */
  private appendOptionalFields(
    formData: { append: (name: string, value: string) => void },
    requestOptions: TranscribeFileRequest
  ): void {
    if (requestOptions.language) {
      formData.append("language", requestOptions.language);
    }

    if (requestOptions.keywords) {
      formData.append("keywords", JSON.stringify(requestOptions.keywords));
    }

    if (requestOptions.vadConfig) {
      formData.append("vad_config", JSON.stringify(requestOptions.vadConfig));
    }
  }

  /**
   * Creates a real-time streaming connection for audio transcription.
   * 
   * The streaming API uses WebSocket for low-latency, bidirectional communication.
   * Audio should be sent as 16-bit PCM at 16kHz sample rate, mono channel.
   * 
   * @param requestOptions - Streaming configuration options
   * @param requestOptions.workflowId - Optional workflow ID (defaults to standard workflow)
   * @param requestOptions.executionId - Optional execution ID for tracking (auto-generated if not provided)
   * @param requestOptions.langCode - Optional language code (e.g., 'en', 'es', 'fr')
   * @param requestOptions.timeZone - Optional timezone for timestamps (defaults to 'UTC')
   * @param requestOptions.keywords - Optional keywords map for boosting recognition
   * @param requestOptions.tasksConfig - Optional AI tasks configuration
   * @param requestOptions.vadConfig - Optional Voice Activity Detection configuration
   * 
   * @returns A StreamingClient instance ready to connect
   * 
   * @throws {AiolaError} If connection fails to initialize
   * 
   * @example
   * ```typescript
   * // Create a streaming session
   * const stream = await client.stt.stream({ 
   *   langCode: 'en',
   *   vadConfig: { 
   *     minSpeechDurationMs: 250,
   *     minSilenceDurationMs: 500
   *   }
   * });
   * 
   * // Listen for transcription events
   * stream.on('transcript', (data) => {
   *   console.log('Transcript:', data.text);
   * });
   * 
   * // Connect and start streaming
   * stream.connect();
   * 
   * // Send audio data (16-bit PCM, 16kHz, mono)
   * stream.send(audioBuffer);
   * 
   * // Close when done
   * stream.disconnect();
   * ```
   */
  public async stream(
    requestOptions: SttStreamRequest
  ): Promise<StreamingClient> {
    const url: string = this.getWebSocketUrl();
    const accessToken = await this.auth.getAccessToken(this.options);
    const { query, headers } = this.buildQueryAndHeaders(
      requestOptions,
      accessToken
    );

    const socket: StreamingClient = new StreamingClient({
      url,
      path: this.path,
      query,
      headers,
    });

    if (!socket) {
      throw new AiolaError({
        message: "Failed to connect to Streaming service",
      });
    }

    return socket;
  }

  /**
   * Transcribes an audio file to text.
   * 
   * Supports multiple audio formats including WAV, MP3, M4A, OGG, and FLAC.
   * The file is uploaded and processed on the server, with results returned
   * once transcription is complete.
   * 
   * Works in both Node.js and browser environments with appropriate file handling
   * for each platform.
   * 
   * @param requestOptions - Transcription request options
   * @param requestOptions.file - Audio file to transcribe (File, Blob, Buffer, or path string)
   * @param requestOptions.language - Optional language code (e.g., 'en', 'es', 'fr')
   * @param requestOptions.keywords - Optional keywords map for boosting recognition
   * @param requestOptions.vadConfig - Optional Voice Activity Detection configuration
   * 
   * @returns Transcription response with text, segments, and metadata
   * 
   * @example
   * ```typescript
   * // Node.js: transcribe from file path
   * const result = await client.stt.transcribeFile({
   *   file: './audio.wav',
   *   language: 'en'
   * });
   * console.log('Transcription:', result.text);
   * console.log('Segments:', result.segments);
   * 
   * // Browser: transcribe from File object
   * const fileInput = document.querySelector('input[type="file"]');
   * const result = await client.stt.transcribeFile({
   *   file: fileInput.files[0],
   *   language: 'en',
   *   keywords: { 'product': 'ProductName' }
   * });
   * ```
   */
  public async transcribeFile(
    requestOptions: TranscribeFileRequest
  ): Promise<TranscribeFileResponse> {
    // For Node.js, we need to properly handle FormData with the form-data package
    // For browser, we use the native FormData API
    let body: BodyInit;
    let additionalHeaders: Record<string, string> = {};

    if (RUNTIME.type === "node") {
      // Use the form-data package in Node.js
      const formData = new FormData();
      
      const { file, options } = prepareFileForFormData(requestOptions.file);
      
      if (options) {
        formData.append("file", file, options);
      } else {
        formData.append("file", file);
      }

      // Append optional fields using helper
      this.appendOptionalFields(formData, requestOptions);

      // Get the headers with Content-Type including boundary
      additionalHeaders = formData.getHeaders();
      
      // Convert FormData to Buffer for Node.js fetch API
      // getBuffer() is available in form-data v4.x and works reliably with Node.js fetch (v18+)
      body = formData.getBuffer() as unknown as BodyInit;
    } else {
      // Use native browser FormData (globalThis.FormData)
      const formData = new globalThis.FormData();
      
      const { file } = prepareFileForFormData(requestOptions.file);
      
      // In browser, options are not used - File objects have their own metadata
      formData.append("file", file as File);

      // Append optional fields using helper
      this.appendOptionalFields(formData, requestOptions);

      body = formData as unknown as BodyInit;
    }

    const response = await this.fetch("/api/speech-to-text/file", {
      method: "POST",
      body,
      headers: additionalHeaders,
    });

    return response.json();
  }

  private getWebSocketUrl(): string {
    return `${this.baseUrl}${this.namespace}`;
  }

  private buildQueryAndHeaders(
    requestOptions: SttStreamRequest,
    accessToken: string
  ): QueryAndHeaders {
    const executionId = requestOptions.executionId || nanoid();

    const query: Record<string, string> = {
      execution_id: executionId,
      flow_id: requestOptions.workflowId || DEFAULT_WORKFLOW_ID,
      time_zone: requestOptions.timeZone || "UTC",
      "x-aiola-api-token": accessToken,
    };

    if (requestOptions.langCode) {
      query.lang_code = requestOptions.langCode;
    }

    if (requestOptions.tasksConfig) {
      query.tasks_config = JSON.stringify(requestOptions.tasksConfig);
    }

    if (requestOptions.keywords) {
      query.keywords = JSON.stringify(requestOptions.keywords);
    }

    if (requestOptions.vadConfig) {
      query.vad_config = JSON.stringify(requestOptions.vadConfig);
    }
    
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    return { query, headers };
  }

}
