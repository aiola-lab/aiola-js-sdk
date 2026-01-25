/**
 * Configuration options for authentication operations.
 * Used when generating tokens or closing sessions without a client instance.
 */
export interface AuthOptions {
  /**
   * Your Aiola API key.
   * Required for authentication and authorization.
   */
  apiKey: string;

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
