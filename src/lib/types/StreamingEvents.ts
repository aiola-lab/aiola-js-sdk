/**
 * Event payload for transcription results.
 */
export interface TranscriptEvent {
  /** The transcribed text */
  transcript: string;
}

/**
 * Event payload for translation results.
 */
export interface TranslationEvent {
  /** The translated text */
  translation: string;
}

/**
 * Event payload for structured data extraction results.
 */
export interface StructuredEvent {
  /**
   * Structured data extracted from the audio.
   * The structure depends on the form/schema configuration.
   */
  results: Record<string, unknown>;
}

/**
 * Schema values for structured data extraction.
 * 
 * Maps field paths (using dot notation) to arrays of expected values.
 * 
 * @example
 * ```typescript
 * const schemaValues = {
 *   'contact.name': ['John Doe', 'Jane Smith'],
 *   'contact.email': ['john@example.com', 'jane@example.com'],
 *   'order.quantity': [1, 2, 3, 5, 10]
 * };
 * ```
 */
export type SchemaValues = Record<string, (string | number)[]>;

/**
 * Response from setting schema values.
 */
export interface SetSchemaValuesResponse {
  /** Status of the operation */
  status: "ok" | "error";
  
  /** Optional error message if status is "error" */
  message?: string;
}

/**
 * Events that can be received from the server during streaming.
 * 
 * Maps event names to their handler signatures.
 */
export interface ServerToClientEvents {
  /** Fired when the WebSocket connection is established */
  connect: () => void;
  
  /** Fired when the WebSocket connection is closed */
  disconnect: () => void;
  
  /** Fired when an error occurs */
  error: (error: Error) => void;
  
  /** Fired when a connection error occurs */
  connect_error: (error: Error) => void;
  
  /**
   * Fired when new transcription text is available.
   * Emitted for each detected speech segment.
   */
  transcript: (data: TranscriptEvent) => void;
  
  /**
   * Fired when structured data is extracted.
   * Only emitted if FORM_FILLING task is enabled.
   */
  structured: (data: StructuredEvent) => void;
  
  /**
   * Fired when translation is available.
   * Only emitted if TRANSLATION task is enabled.
   */
  translation: (data: TranslationEvent) => void;
  
  /**
   * Fired when schema values are successfully updated.
   * Confirmation event after calling setSchemaValues().
   */
  schema_values_updated: (data: SetSchemaValuesResponse) => void;
}

/**
 * Optional metadata to send with each audio chunk.
 * Can include fields like sub_flow_id for routing purposes.
 */
export interface BinaryDataMetadata {
  [key: string]: unknown;
}

/**
 * Events that can be sent to the server during streaming.
 * 
 * Maps event names to their handler signatures.
 * @internal
 */
export interface ClientToServerEvents {
  /** Update keywords for recognition boosting */
  set_keywords: (keywords: Uint8Array) => void;
  
  /** Update schema values for structured data extraction */
  set_schema_values: (
    schemaValues: Uint8Array,
    callback?: (response: SetSchemaValuesResponse) => void
  ) => void;
  
  /** Send audio data for transcription */
  binary_data: (data: Buffer, metadata?: BinaryDataMetadata) => void;
}

/**
 * Names of streaming events (excludes connection lifecycle events).
 */
export type StreamingEventName = keyof Omit<
  ServerToClientEvents,
  "connect" | "disconnect" | "error" | "connect_error"
>;

/**
 * Type helper to extract event data type from event name.
 */
export type StreamingEventData<T extends StreamingEventName> = Parameters<
  ServerToClientEvents[T]
>[0];

/**
 * Names of connection lifecycle events.
 */
export type ConnectionEventName =
  | "connect"
  | "disconnect"
  | "error"
  | "connect_error";

/**
 * All valid event names (streaming + connection events).
 */
export type ValidEventName = StreamingEventName | ConnectionEventName;
