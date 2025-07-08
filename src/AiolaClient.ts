import {AiolaClientOptions, AuthOptions, ClientConfig} from "./lib/types";
import { Stt } from "./clients/stt";
import { Tts } from "./clients/tts";
import { Auth } from "./clients/auth";
import { DEFAULT_AUTH_BASE_URL, DEFAULT_WORKFLOW_ID, DEFAULT_BASE_URL } from "./lib/constants";

export class AiolaClient {
  private _stt: Stt | null = null;
  private _tts: Tts | null = null;
  private _auth: Auth | null = null;
  private readonly _clientConfig: ClientConfig;

  constructor(opts: AiolaClientOptions) {
    // Resolve the configuration once during construction
    this._clientConfig = {
      apiKey: opts.apiKey,
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
   * This is the recommended way to generate tokens in backend services
   * 
   * @param opts - The configuration options
   * @returns Promise<string> - The generated access token
   * 
   * @example
   * ```typescript
   * const accessToken = await AiolaClient.grantToken({ apiKey: 'your-api-key' });
   * const client = new AiolaClient({ accessToken });
   * ```
   */
  static async grantToken(opts: AuthOptions): Promise<string> {
    return Auth.grantToken({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || DEFAULT_AUTH_BASE_URL,
      workflowId: opts.workflowId || DEFAULT_WORKFLOW_ID
    });
  }
}