export interface TranscriptEvent {
  transcript: string;
}

export interface TranslationEvent {
  translation: string;
}

export interface StructuredEvent {
  results: Record<string, unknown>;
}

export type SchemaValues = Record<string, (string | number)[]>;

export interface SetSchemaValuesResponse {
  status: "ok" | "error";
  message?: string;
}

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  connect_error: (error: Error) => void;
  transcript: (data: TranscriptEvent) => void;
  structured: (data: StructuredEvent) => void;
  translation: (data: TranslationEvent) => void;
  schema_values_updated: (data: SetSchemaValuesResponse) => void;
}

export interface ClientToServerEvents {
  set_keywords: (keywords: Uint8Array) => void;
  set_schema_values: (
    schemaValues: Uint8Array,
    callback?: (response: SetSchemaValuesResponse) => void
  ) => void;
  binary_data: (data: Buffer) => void;
}

export type StreamingEventName = keyof Omit<
  ServerToClientEvents,
  "connect" | "disconnect" | "error" | "connect_error"
>;

export type StreamingEventData<T extends StreamingEventName> = Parameters<
  ServerToClientEvents[T]
>[0];

export type ConnectionEventName =
  | "connect"
  | "disconnect"
  | "error"
  | "connect_error";

export type ValidEventName = StreamingEventName | ConnectionEventName;
