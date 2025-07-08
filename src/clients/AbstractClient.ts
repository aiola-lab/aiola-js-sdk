import { ClientConfig } from "../lib/types";
import { createAuthenticatedFetch } from "../lib/fetch";
import { Auth } from "./auth/Client";

export abstract class AbstractClient {
  protected readonly fetch: (url: string, init?: RequestInit) => Promise<Response>;
  protected readonly baseUrl: string;
  
  constructor(
    protected readonly options: ClientConfig,
    protected readonly auth: Auth
  ) {
    this.baseUrl = options.baseUrl;
    this.fetch = createAuthenticatedFetch(this.options, this.auth);
  }
}