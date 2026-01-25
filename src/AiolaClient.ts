import {
  AiolaClientOptions,
  AuthOptions,
  ClientConfig,
  SessionCloseResponse,
  GrantTokenResponse,
} from "./lib/types";
import { Stt } from "./clients/stt";
import { Tts } from "./clients/tts";
import { Auth } from "./clients/auth";
import {
  DEFAULT_AUTH_BASE_URL,
  DEFAULT_WORKFLOW_ID,
  DEFAULT_BASE_URL,
} from "./lib/constants";

/**
 * Main client for interacting with the Aiola API.
 * 
 * Provides access to Speech-to-Text (STT), Text-to-Speech (TTS), and authentication services.
 * The client uses lazy initialization for service clients, creating them only when first accessed.
 * 
 * @example
 * ```typescript
 * // First, generate an access token
 * const tokenResponse = await AiolaClient.grantToken({ 
 *   apiKey: 'your-api-key' 
 * });
 * 
 * // Create a client instance
 * const client = new AiolaClient({ 
 *   accessToken: tokenResponse.accessToken 
 * });
 * 
 * // Use STT services
 * const transcription = await client.stt.transcribeFile({ 
 *   file: audioFile 
 * });
 * 
 * // Use TTS services
 * const audioStream = await client.tts.synthesize({ 
 *   text: 'Hello world' 
 * });
 * 
 * // Close session when done
 * await AiolaClient.closeSession(tokenResponse.accessToken, { 
 *   apiKey: 'your-api-key' 
 * });
 * ```
 */
export class AiolaClient {
  private _stt: Stt | null = null;
  private _tts: Tts | null = null;
  private _auth: Auth | null = null;
  private readonly _clientConfig: ClientConfig;

  /**
   * Creates a new AiolaClient instance.
   * 
   * The client requires a valid access token, which can be obtained using the static
   * `grantToken()` method. The token is validated during construction and must not be
   * expired (tokens have a 5-minute expiration buffer).
   * 
   * @param opts - Client configuration options
   * @param opts.accessToken - Valid access token obtained from `grantToken()`
   * @param opts.baseUrl - Optional custom API base URL (defaults to production URL)
   * @param opts.authBaseUrl - Optional custom authentication base URL (defaults to production URL)
   * @param opts.workflowId - Optional custom workflow ID (defaults to standard workflow)
   * 
   * @throws {Error} If the access token is invalid or expired
   * 
   * @example
   * ```typescript
   * const tokenResponse = await AiolaClient.grantToken({ apiKey: 'your-api-key' });
   * const client = new AiolaClient({ 
   *   accessToken: tokenResponse.accessToken,
   *   baseUrl: 'https://custom-api.aiola.com' // optional
   * });
   * ```
   */
  constructor(opts: AiolaClientOptions) {
    // Validate access token
    if (!Auth.isTokenValid(opts.accessToken)) {
      throw new Error("Invalid or expired access token. Please generate a new token using AiolaClient.grantToken()");
    }

    // Resolve the configuration once during construction
    this._clientConfig = {
      accessToken: opts.accessToken,
      baseUrl: opts.baseUrl || DEFAULT_BASE_URL,
      authBaseUrl: opts.authBaseUrl || DEFAULT_AUTH_BASE_URL,
      workflowId: opts.workflowId || DEFAULT_WORKFLOW_ID,
    };
  }

  /**
   * Gets the client configuration options.
   * 
   * Returns the resolved configuration including default values for any
   * options that were not explicitly provided during construction.
   * 
   * @returns The client configuration with all options resolved
   */
  public get options() {
    return this._clientConfig;
  }

  /**
   * Gets the Speech-to-Text (STT) client.
   * 
   * Provides access to transcription services including file transcription
   * and real-time streaming. The client is lazily initialized on first access.
   * 
   * @returns The STT client instance
   * 
   * @example
   * ```typescript
   * // Transcribe an audio file
   * const result = await client.stt.transcribeFile({ file: audioFile });
   * 
   * // Start a streaming session
   * const stream = await client.stt.stream({ langCode: 'en' });
   * ```
   */
  public get stt() {
    return (this._stt ??= new Stt(this._clientConfig, this.auth));
  }

  /**
   * Gets the Text-to-Speech (TTS) client.
   * 
   * Provides access to speech synthesis services. The client is lazily
   * initialized on first access.
   * 
   * @returns The TTS client instance
   * 
   * @example
   * ```typescript
   * // Synthesize text to speech
   * const audioStream = await client.tts.synthesize({ 
   *   text: 'Hello world',
   *   voiceId: 'en-US-JennyNeural'
   * });
   * ```
   */
  public get tts() {
    return (this._tts ??= new Tts(this._clientConfig, this.auth));
  }

  /**
   * Gets the authentication client.
   * 
   * Used internally for token management and validation. The client is lazily
   * initialized on first access. Most users will not need to access this directly.
   * 
   * @returns The authentication client instance
   * @internal
   */
  public get auth() {
    return (this._auth ??= new Auth());
  }

  /**
   * Generate an access token from an API key without instantiating a client
   * Server handles concurrency limits and will return appropriate errors
   *
   * @param opts - The configuration options
   * @returns Promise<GrantTokenResponse> - The generated access token and session ID
   *
   * @example
   * ```typescript
   * const tokenResponse = await AiolaClient.grantToken({ apiKey: 'your-api-key' });
   * const client = new AiolaClient({ accessToken: tokenResponse.accessToken });
   * ```
   */
  static async grantToken(opts: AuthOptions): Promise<GrantTokenResponse> {
    return Auth.grantToken({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || DEFAULT_BASE_URL,
      authBaseUrl: opts.authBaseUrl || DEFAULT_AUTH_BASE_URL,
      workflowId: opts.workflowId || DEFAULT_WORKFLOW_ID,
    });
  }

  /**
   * Close a session on the server
   * This terminates the session and frees up concurrency slots
   *
   * @param accessToken - The access token for the session
   * @param opts - The configuration options
   * @returns Promise<SessionCloseResponse> - The session close response
   *
   * @example
   * ```typescript
   * await AiolaClient.closeSession(accessToken, { apiKey: 'your-api-key' });
   * ```
   */
  static async closeSession(
    accessToken: string,
    opts: AuthOptions,
  ): Promise<SessionCloseResponse> {
    return Auth.closeSession(accessToken, {
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || DEFAULT_BASE_URL,
      authBaseUrl: opts.authBaseUrl || DEFAULT_AUTH_BASE_URL,
      workflowId: opts.workflowId || DEFAULT_WORKFLOW_ID,
    });
  }
}
