export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionMetadata {
  duration: number;
  language: string;
  sample_rate: number;
  num_channels: number;
  timestamp_utc: string;
  model_version: string;
}

export interface TranscribeFileResponse {
  transcript: string;
  itn_transcript: string;
  segments: Segment[];
  metadata: TranscriptionMetadata;
}
