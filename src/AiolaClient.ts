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

export class AiolaClient {
  private _stt: Stt | null = null;
  private _tts: Tts | null = null;
  private _auth: Auth | null = null;
  private readonly _clientConfig: ClientConfig;

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

  public get options() {
    return this._clientConfig;
  }

  public get stt() {
    return (this._stt ??= new Stt(this._clientConfig, this.auth));
  }

  public get tts() {
    return (this._tts ??= new Tts(this._clientConfig, this.auth));
  }

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
