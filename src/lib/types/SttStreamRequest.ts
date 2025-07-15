export interface TranslationPayload {
  src_lang_code: string;
  dst_lang_code: string;
}

export interface EntityDetectionFromListPayload {
  entity_list: string[];
}

export type EntityDetectionPayload = Record<string, never>;

export type KeyPhrasesPayload = Record<string, never>;

export type PiiRedactionPayload = Record<string, never>;

export type SentimentAnalysisPayload = Record<string, never>;

export type SummarizationPayload = Record<string, never>;

export type TopicDetectionPayload = Record<string, never>;

export type ContentModerationPayload = Record<string, never>;

export type AutoChaptersPayload = Record<string, never>;

export type FormFillingPayload = Record<string, never>;

type TaskPayloads = {
  FORM_FILLING: FormFillingPayload;
  TRANSLATION: TranslationPayload;
  ENTITY_DETECTION: EntityDetectionPayload;
  ENTITY_DETECTION_FROM_LIST: EntityDetectionFromListPayload;
  KEY_PHRASES: KeyPhrasesPayload;
  PII_REDACTION: PiiRedactionPayload;
  SENTIMENT_ANALYSIS: SentimentAnalysisPayload;
  SUMMARIZATION: SummarizationPayload;
  TOPIC_DETECTION: TopicDetectionPayload;
  CONTENT_MODERATION: ContentModerationPayload;
  AUTO_CHAPTERS: AutoChaptersPayload;
};

export type TasksConfig = Partial<TaskPayloads>;

export interface SttStreamRequest {
  workflowId?: string;
  executionId?: string;
  langCode?: string;
  timeZone?: string;
  tasksConfig?: TasksConfig;
  keywords?: Record<string, string>;
}
