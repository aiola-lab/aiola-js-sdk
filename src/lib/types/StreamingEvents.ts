export interface TranscriptEvent {
  transcript: string;
}

export interface TranslationEvent {
  translation: string;
}

export interface StructuredEvent {
  results: Record<string, unknown>;
}


export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  connect_error: (error: Error) => void;
  transcript: (data: TranscriptEvent) => void;
  structured: (data: StructuredEvent) => void;
  translation: (data: TranslationEvent) => void;
}

export interface ClientToServerEvents {
  set_keywords: (keywords: Uint8Array) => void;
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
