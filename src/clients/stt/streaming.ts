import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  StreamingEventName,
  StreamingEventData,
  ValidEventName,
  SchemaValues,
  SetSchemaValuesResponse,
  BinaryDataMetadata,
} from "../../lib/types/StreamingEvents";

/**
 * Configuration options for creating a StreamingClient.
 * @internal
 */
export interface StreamingClientOptions {
  /** WebSocket URL */
  url: string;
  /** Socket.IO path */
  path: string;
  /** Query parameters for connection */
  query: Record<string, string>;
  /** HTTP headers for connection */
  headers: Record<string, string>;
}

/**
 * WebSocket client for real-time audio streaming and transcription.
 * 
 * Handles bidirectional communication with the Aiola streaming service using Socket.IO.
 * Supports automatic reconnection, event-based communication, and real-time transcription
 * with various AI-powered features.
 * 
 * Audio must be sent as 16-bit PCM format at 16kHz sample rate, mono channel.
 * 
 * @example
 * ```typescript
 * // Create streaming session
 * const stream = await client.stt.stream({ langCode: 'en' });
 * 
 * // Set up event listeners
 * stream
 *   .on('connect', () => console.log('Connected'))
 *   .on('transcript', (data) => console.log('Text:', data.text))
 *   .on('structured', (data) => console.log('Structured:', data.structured))
 *   .on('error', (error) => console.error('Error:', error));
 * 
 * // Connect and start streaming
 * stream.connect();
 * stream.send(audioBuffer);
 * 
 * // Clean up
 * stream.disconnect();
 * ```
 */
export class StreamingClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  /**
   * Creates a new StreamingClient instance.
   * 
   * @param options - Connection configuration options
   * @internal
   */
  constructor(options: StreamingClientOptions) {
    const { url, path, query, headers } = options;

    this.socket = io(url, {
      path,
      query,
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      withCredentials: true,
      extraHeaders: headers,
      transportOptions: {
        polling: {
          extraHeaders: headers,
        },
        websocket: {
          extraHeaders: headers,
        },
      },
    });
  }

  /**
   * Sends audio data to the streaming service.
   * 
   * Audio must be in 16-bit PCM format at 16kHz sample rate, mono channel.
   * Send audio in chunks as it becomes available (typically 100-1000ms chunks).
   * 
   * @param audioData - Audio data buffer to send (16-bit PCM, 16kHz, mono)
   * @param metadata - Optional metadata for the audio chunk (e.g., { sub_flow_id: 'container-123' })
   * 
   * @example
   * ```typescript
   * // Send audio chunk
   * stream.send(audioBuffer);
   * 
   * // Send with metadata
   * stream.send(audioBuffer, { sub_flow_id: 'session-123' });
   * ```
   */
  send(audioData: Buffer, metadata?: BinaryDataMetadata): void {
    if (metadata) {
      this.socket.emit("binary_data", audioData, metadata);
    } else {
      this.socket.emit("binary_data", audioData);
    }
  }

  /**
   * Registers an event listener for streaming events.
   * 
   * Available events:
   * - `transcript`: Real-time transcription results
   * - `structured`: Structured data extraction results
   * - `translation`: Translation results (if enabled)
   * - `schema_values_updated`: Schema values update confirmation
   * - `connect`: Connection established
   * - `disconnect`: Connection closed
   * - `error`: Error occurred
   * - `connect_error`: Connection error
   * 
   * @param event - Event name to listen to
   * @param listener - Event listener function with type-safe payload
   * @returns This StreamingClient instance for chaining
   * 
   * @example
   * ```typescript
   * stream
   *   .on('transcript', (data) => {
   *     console.log('Transcript:', data.text);
   *     console.log('Is final:', data.isFinal);
   *     console.log('Timestamp:', data.timestamp);
   *   })
   *   .on('structured', (data) => {
   *     console.log('Structured data:', data.structured);
   *   })
   *   .on('error', (error) => {
   *     console.error('Stream error:', error);
   *   });
   * ```
   */
  on<T extends ValidEventName>(
    event: T,
    listener: T extends StreamingEventName
      ? (data: StreamingEventData<T>) => void
      : T extends "connect" | "disconnect"
        ? () => void
        : T extends "error" | "connect_error"
          ? (error: Error) => void
          : never,
  ): this {
    (this.socket as Socket).on(
      event as string,
      listener as (...args: unknown[]) => void,
    );
    return this;
  }

  /**
   * Removes an event listener.
   * 
   * @param event - Event name
   * @param listener - Event listener function to remove (if not provided, removes all listeners for the event)
   * @returns This StreamingClient instance for chaining
   * 
   * @example
   * ```typescript
   * const handler = (data) => console.log(data);
   * stream.on('transcript', handler);
   * 
   * // Remove specific listener
   * stream.off('transcript', handler);
   * 
   * // Remove all listeners for event
   * stream.off('transcript');
   * ```
   */
  off<T extends ValidEventName>(
    event: T,
    listener?: T extends StreamingEventName
      ? (data: StreamingEventData<T>) => void
      : T extends "connect" | "disconnect"
        ? () => void
        : T extends "error" | "connect_error"
          ? (error: Error) => void
          : never,
  ): this {
    (this.socket as Socket).off(
      event as string,
      listener as ((...args: unknown[]) => void) | undefined,
    );
    return this;
  }

  /**
   * Sets or updates keywords for the streaming session.
   * 
   * Keywords are used to boost recognition of specific terms or phrases.
   * The map format is: { 'spoken_phrase': 'written_form' }
   * 
   * @param keywords - Map of keywords where keys are spoken phrases and values are their written forms
   * 
   * @example
   * ```typescript
   * stream.setKeywords({
   *   'eye ola': 'Aiola',
   *   'open AI': 'OpenAI',
   *   'docker': 'Docker'
   * });
   * ```
   */
  setKeywords(keywords: Record<string, string>): void {
    this.socket.emit("set_keywords", new TextEncoder().encode(JSON.stringify(keywords)));
  }

  /**
   * Sets schema values for structured data extraction.
   * 
   * Schema values define expected options for structured fields, improving extraction accuracy.
   * Use dot notation for nested fields: 'parent.child'
   * 
   * The callback provides immediate acknowledgment, while the 'schema_values_updated' event
   * confirms when values are actually applied on the server.
   * 
   * @param schemaValues - Map of field paths to arrays of expected values
   * @param callback - Optional callback for immediate acknowledgment response
   * 
   * @example
   * ```typescript
   * // Using acknowledgment callback for immediate response
   * streamingClient.setSchemaValues(
   *   {
   *     "contact.name": ["John Doe", "Jane Smith", "Bob Johnson"],
   *     "contact.email": ["john@example.com", "jane@example.com"]
   *   },
   *   (response) => {
   *     if (response.status === "ok") {
   *       console.log("Schema values set successfully");
   *     } else {
   *       console.error("Error:", response.error);
   *     }
   *   }
   * );
   *
   * // Listen for schema_values_updated event (when values are actually updated on server)
   * streamingClient.on("schema_values_updated", (data) => {
   *   console.log("Schema values updated:", data.schemaValues);
   *   console.log("Timestamp:", data.timestamp);
   * });
   * ```
   */
  setSchemaValues(
    schemaValues: SchemaValues,
    callback?: (response: SetSchemaValuesResponse) => void
  ): void {
    const encodedData = new TextEncoder().encode(JSON.stringify(schemaValues));

    if (callback) {
      this.socket.emit("set_schema_values", encodedData, callback);
    } else {
      this.socket.emit("set_schema_values", encodedData);
    }
  }

  /**
   * Establishes the WebSocket connection to the streaming service.
   * 
   * Connection is automatic on first use, but this method can be called explicitly.
   * Listen to the 'connect' event to know when the connection is established.
   * 
   * @returns This StreamingClient instance for chaining
   * 
   * @example
   * ```typescript
   * stream.on('connect', () => {
   *   console.log('Connected, ready to stream');
   * });
   * stream.connect();
   * ```
   */
  connect(): this {
    this.socket.connect();
    return this;
  }

  /**
   * Closes the WebSocket connection to the streaming service.
   * 
   * This gracefully terminates the connection. Always disconnect when finished
   * to free up server resources.
   * 
   * @returns This StreamingClient instance for chaining
   * 
   * @example
   * ```typescript
   * stream.on('disconnect', () => {
   *   console.log('Disconnected');
   * });
   * stream.disconnect();
   * ```
   */
  disconnect(): this {
    this.socket.disconnect();
    return this;
  }

  /**
   * Indicates whether the client is currently connected to the streaming service.
   * 
   * @returns True if connected, false otherwise
   * 
   * @example
   * ```typescript
   * if (stream.connected) {
   *   stream.send(audioBuffer);
   * }
   * ```
   */
  get connected(): boolean {
    return this.socket.connected;
  }

  /**
   * Gets the unique socket connection ID.
   * 
   * This ID is assigned by the server upon connection and can be used
   * for debugging and logging purposes.
   * 
   * @returns The socket ID if connected, undefined otherwise
   * 
   * @example
   * ```typescript
   * stream.on('connect', () => {
   *   console.log('Connected with ID:', stream.id);
   * });
   * ```
   */
  get id(): string | undefined {
    return this.socket.id;
  }
}
