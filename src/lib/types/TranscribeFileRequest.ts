import fs from "fs";
import { VadConfig } from "./VadConfig";

/**
 * Supported file sources for audio transcription.
 * 
 * - `File`: Browser File object from file input or drag-and-drop
 * - `fs.ReadStream`: Node.js file stream from fs.createReadStream()
 * - `Blob`: Browser Blob object
 * - `Buffer`: Node.js Buffer object
 * - `string`: File path (Node.js only)
 */
export type FileSource = File | fs.ReadStream | Blob | Buffer;

/**
 * Request options for transcribing an audio file.
 */
export interface TranscribeFileRequest {
  /**
   * Audio file to transcribe.
   * 
   * Supported formats: WAV, MP3, M4A, OGG, FLAC
   * 
   * In Node.js: File path (string), Buffer, or ReadStream
   * In Browser: File or Blob object
   */
  file: FileSource;

  /**
   * Optional language code for transcription.
   * 
   * Examples: 'en' (English), 'es' (Spanish), 'fr' (French), 'de' (German)
   * 
   * If not specified, the service will attempt to auto-detect the language.
   */
  language?: string;

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
   * Controls how speech segments are detected and separated in the audio.
   */
  vadConfig?: VadConfig;
}
