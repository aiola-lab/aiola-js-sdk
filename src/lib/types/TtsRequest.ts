import { VoiceId } from "./VoiceId";

/**
 * Request options for text-to-speech synthesis.
 */
export interface TtsRequest {
  /**
   * The text to convert to speech.
   * 
   * Can include punctuation and formatting which may affect prosody and pauses.
   */
  text: string;

  /**
   * Voice identifier for the synthesis.
   * 
   * Use the VoiceId enum for type safety, or provide a string value directly.
   * 
   * Supported voices:
   * - VoiceId.EnglishUSFemale ('en_us_female') - English (US) Female
   * - VoiceId.EnglishUSMale ('en_us_male') - English (US) Male
   * - VoiceId.SpanishFemale ('es_female') - Spanish Female
   * - VoiceId.SpanishMale ('es_male') - Spanish Male
   * - VoiceId.FrenchFemale ('fr_female') - French Female
   * - VoiceId.FrenchMale ('fr_male') - French Male
   * - VoiceId.GermanFemale ('de_female') - German Female
   * - VoiceId.GermanMale ('de_male') - German Male
   * - VoiceId.JapaneseFemale ('ja_female') - Japanese Female
   * - VoiceId.JapaneseMale ('ja_male') - Japanese Male
   * - VoiceId.PortugueseFemale ('pt_female') - Portuguese Female
   * - VoiceId.PortugueseMale ('pt_male') - Portuguese Male
   * 
   * @example
   * ```typescript
   * // Using enum (recommended for type safety)
   * { text: 'Hello', voice_id: VoiceId.EnglishUSFemale }
   * 
   * // Using string
   * { text: 'Hello', voice_id: 'en_us_female' }
   * ```
   */
  voice_id: VoiceId | string;
}
