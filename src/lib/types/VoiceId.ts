/**
 * Supported voice identifiers for text-to-speech synthesis.
 * 
 * Use these enum values to ensure type safety when specifying voices.
 * 
 * @example
 * ```typescript
 * import { AiolaClient, VoiceId } from '@aiola/sdk';
 * 
 * const audio = await client.tts.synthesize({
 *   text: 'Hello, world!',
 *   voice_id: VoiceId.EnglishUSFemale
 * });
 * ```
 */
export enum VoiceId {
  /** English (US) - Female voice */
  EnglishUSFemale = 'en_us_female',
  
  /** English (US) - Male voice */
  EnglishUSMale = 'en_us_male',
  
  /** Spanish - Female voice */
  SpanishFemale = 'es_female',
  
  /** Spanish - Male voice */
  SpanishMale = 'es_male',
  
  /** French - Female voice */
  FrenchFemale = 'fr_female',
  
  /** French - Male voice */
  FrenchMale = 'fr_male',
  
  /** German - Female voice */
  GermanFemale = 'de_female',
  
  /** German - Male voice */
  GermanMale = 'de_male',
  
  /** Japanese - Female voice */
  JapaneseFemale = 'ja_female',
  
  /** Japanese - Male voice */
  JapaneseMale = 'ja_male',
  
  /** Portuguese - Female voice */
  PortugueseFemale = 'pt_female',
  
  /** Portuguese - Male voice */
  PortugueseMale = 'pt_male',
}
