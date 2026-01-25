/**
 * Configuration options for creating an AiolaClient instance.
 */
export interface AiolaClientOptions {
  /**
   * Valid access token obtained from `AiolaClient.grantToken()`.
   * Required for all API requests. Tokens expire after a period of time.
   */
  accessToken: string;

  /**
   * Optional custom API base URL.
   * Defaults to the production Aiola API endpoint.
   */
  baseUrl?: string;

  /**
   * Optional custom authentication service base URL.
   * Defaults to the production Aiola authentication endpoint.
   */
  authBaseUrl?: string;

  /**
   * Optional custom workflow ID.
   * Workflows define the AI processing pipeline. Defaults to the standard workflow.
   */
  workflowId?: string;
}

/**
 * Resolved client configuration with all defaults applied.
 * Used internally by the SDK.
 * @internal
 */
export interface ClientConfig {
  /** Access token for API authentication */
  accessToken: string;
  
  /** Resolved API base URL */
  baseUrl: string;
  
  /** Resolved authentication base URL */
  authBaseUrl: string;
  
  /** Resolved workflow ID */
  workflowId: string;
}
