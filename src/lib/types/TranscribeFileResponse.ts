export interface Segment {
  start: number;
  end: number;
}

export interface TranscriptionMetadata {
  file_duration: number;
  language: string;
  sample_rate: number;
  num_channels: number;
  timestamp_utc: string;
  segments_count: number;
  total_speech_duration: number;
}

export interface TranscribeFileResponse {
  transcript: string;
  raw_transcript: string;
  segments: Segment[];
  metadata: TranscriptionMetadata;
}