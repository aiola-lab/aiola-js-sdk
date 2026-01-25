/**
 * Time segment representing a portion of audio.
 */
export interface Segment {
  /** Start time of the segment in seconds */
  start: number;
  
  /** End time of the segment in seconds */
  end: number;
}

/**
 * Metadata about the transcribed audio file.
 */
export interface TranscriptionMetadata {
  /** Total duration of the audio file in seconds */
  file_duration: number;
  
  /** Detected or specified language code (e.g., 'en', 'es', 'fr') */
  language: string;
  
  /** Sample rate of the audio file in Hz (e.g., 16000, 44100) */
  sample_rate: number;
  
  /** Number of audio channels (1 for mono, 2 for stereo) */
  num_channels: number;
  
  /** ISO 8601 timestamp when the transcription was processed */
  timestamp_utc: string;
  
  /** Number of speech segments detected in the audio */
  segments_count: number;
  
  /** Total duration of detected speech in seconds (excludes silence) */
  total_speech_duration: number;
}

/**
 * Response from transcribing an audio file.
 */
export interface TranscribeFileResponse {
  /**
   * The complete transcription text with formatting and punctuation.
   * This is the processed, production-ready transcript.
   */
  transcript: string;
  
  /**
   * The raw transcription text without post-processing.
   * Useful for debugging or custom post-processing pipelines.
   */
  raw_transcript: string;
  
  /**
   * Array of time segments indicating where speech was detected.
   * Useful for creating captions or navigating through the audio.
   */
  segments: Segment[];
  
  /**
   * Metadata about the transcription and the source audio file.
   */
  metadata: TranscriptionMetadata;
}