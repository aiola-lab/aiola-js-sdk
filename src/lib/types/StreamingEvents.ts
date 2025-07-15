export interface TranscriptEvent {
  transcript: string;
}

export interface TranslationEvent {
  translation: string;
}

export interface Entity {
  text: string;
  type: string;
  description?: string;
}

export interface EntityDetectionEvent {
  entities: Entity[];
}

export interface EntityDetectionFromListEvent {
  entities: Entity[];
}

export interface KeyPhrasesEvent {
  key_phrases: string[];
}

export interface FormFillingEvent {
  results: Record<string, unknown>;
}

export interface PiiRedactionEvent {
  redacted_text: string;
}

export interface Sentiment {
  overall: string;
  explanation: string;
}

export interface SentimentAnalysisEvent {
  sentiment: Sentiment;
}

export interface SummarizationEvent {
  summary: string;
}

export interface TopicDetectionEvent {
  topics: string[];
}

interface ContentModeration {
  issues: string[];
  details: string[];
}

export interface ContentModerationEvent {
  moderation: ContentModeration;
}

interface Chapter {
  title: string;
  summary: string;
}

export interface AutoChaptersEvent {
  chapters: Chapter[];
}

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  connect_error: (error: Error) => void;
  transcript: (data: TranscriptEvent) => void;
  form_filling: (data: FormFillingEvent) => void;
  translation: (data: TranslationEvent) => void;
  entity_detection: (data: EntityDetectionEvent) => void;
  entity_detection_from_list: (data: EntityDetectionFromListEvent) => void;
  key_phrases: (data: KeyPhrasesEvent) => void;
  pii_redaction: (data: PiiRedactionEvent) => void;
  sentiment_analysis: (data: SentimentAnalysisEvent) => void;
  summarization: (data: SummarizationEvent) => void;
  topic_detection: (data: TopicDetectionEvent) => void;
  content_moderation: (data: ContentModerationEvent) => void;
  auto_chapters: (data: AutoChaptersEvent) => void;
}

export interface ClientToServerEvents {
  setKeywords: (keywords: Record<string, string>) => void;
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
