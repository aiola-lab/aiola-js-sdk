export interface AiolaClientOptions {
  accessToken: string;
  baseUrl?: string;
  authBaseUrl?: string;
  workflowId?: string;
  timeout?: number;
}

export interface ClientConfig {
  accessToken: string;
  baseUrl: string;
  authBaseUrl: string;
  workflowId: string;
  timeout: number;
}
