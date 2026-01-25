/**
 * Voice Activity Detection (VAD) configuration.
 * 
 * Controls how the system detects speech and silence in audio streams,
 * affecting when transcription events are emitted and how audio is segmented.
 */
export interface VadConfig {
  /**
   * Probability threshold for speech detection (0.0 to 1.0).
   * 
   * Higher values make the detector more conservative (less likely to detect speech).
   * Lower values make it more sensitive (may include more non-speech sounds).
   * 
   * Default is typically around 0.5.
   */
  threshold?: number;

  /**
   * Minimum duration of speech in milliseconds to trigger detection.
   * 
   * Speech shorter than this duration will be ignored, reducing false positives
   * from brief sounds or noise.
   * 
   * Default is typically 250ms.
   */
  min_speech_ms?: number;

  /**
   * Minimum duration of silence in milliseconds to split speech segments.
   * 
   * Pauses shorter than this will not split the segment. Longer pauses will
   * cause the current segment to end and emit a transcription event.
   * 
   * Default is typically 500ms.
   */
  min_silence_ms?: number;

  /**
   * Maximum duration of a speech segment in milliseconds.
   * 
   * Prevents extremely long segments. When this duration is reached,
   * the segment will be finalized and a new one will begin.
   * 
   * Default is typically 30000ms (30 seconds).
   */
  max_segment_ms?: number;
}