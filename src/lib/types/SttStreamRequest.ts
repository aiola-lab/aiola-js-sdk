import { VadConfig } from "./VadConfig";

/**
 * Configuration for translation task.
 */
export interface TranslationPayload {
  /** Source language code (e.g., 'en', 'es') */
  src_lang_code: string;
  
  /** Destination language code (e.g., 'es', 'fr') */
  dst_lang_code: string;
}

/**
 * Configuration for entity detection from a predefined list.
 */
export interface EntityDetectionFromListPayload {
  /** List of entities to detect in the audio */
  entity_list: string[];
}

/** Configuration for general entity detection task */
export type EntityDetectionPayload = Record<string, never>;

/** Configuration for key phrases extraction task */
export type KeyPhrasesPayload = Record<string, never>;

/** Configuration for PII (Personally Identifiable Information) redaction task */
export type PiiRedactionPayload = Record<string, never>;

/** Configuration for sentiment analysis task */
export type SentimentAnalysisPayload = Record<string, never>;

/** Configuration for summarization task */
export type SummarizationPayload = Record<string, never>;

/** Configuration for topic detection task */
export type TopicDetectionPayload = Record<string, never>;

/** Configuration for content moderation task */
export type ContentModerationPayload = Record<string, never>;

/** Configuration for automatic chapters generation task */
export type AutoChaptersPayload = Record<string, never>;

/** Configuration for form filling task */
export type FormFillingPayload = Record<string, never>;

/**
 * Internal type mapping task names to their payload types.
 * @internal
 */
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

/**
 * Configuration for AI tasks to run during transcription.
 * 
 * Specify which AI-powered analysis tasks should be applied to the audio stream.
 * Each task can have its own configuration payload.
 * 
 * @example
 * ```typescript
 * const tasksConfig = {
 *   TRANSLATION: {
 *     src_lang_code: 'en',
 *     dst_lang_code: 'es'
 *   },
 *   SENTIMENT_ANALYSIS: {},
 *   PII_REDACTION: {}
 * };
 * ```
 */
export type TasksConfig = Partial<TaskPayloads>;

/**
 * Request options for creating a streaming transcription session.
 */
export interface SttStreamRequest {
  /**
   * Optional custom workflow ID.
   * Workflows define the AI processing pipeline. Defaults to the standard workflow.
   */
  workflowId?: string;

  /**
   * Optional execution ID for tracking this session.
   * Auto-generated if not provided. Useful for correlating logs and events.
   */
  executionId?: string;

  /**
   * Optional language code for transcription.
   * 
   * Examples: 'en' (English), 'es' (Spanish), 'fr' (French), 'de' (German)
   * 
   * If not specified, the service will attempt to auto-detect the language.
   */
  langCode?: string;

  /**
   * Optional timezone for timestamps in events.
   * 
   * Defaults to 'UTC'. Use IANA timezone format (e.g., 'America/New_York', 'Europe/London').
   */
  timeZone?: string;

  /**
   * Optional AI tasks configuration.
   * 
   * Specify which AI-powered analysis tasks should run on the audio stream
   * (e.g., translation, sentiment analysis, entity detection).
   */
  tasksConfig?: TasksConfig;

  /**
   * Optional keywords map for boosting recognition accuracy.
   * 
   * Format: { 'spoken_phrase': 'written_form' }
   * 
   * Example: { 'eye ola': 'Aiola', 'open AI': 'OpenAI' }
   */
  keywords?: Record<string, string>;

  /**
   * Optional Voice Activity Detection configuration.
   * 
   * Controls how speech segments are detected and when transcription events are emitted.
   */
  vadConfig?: VadConfig;
}
