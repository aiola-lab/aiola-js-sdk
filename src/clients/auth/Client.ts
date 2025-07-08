import { AiolaError } from "../../lib/errors";
import { createUnauthenticatedFetch } from "../../lib/fetch";
import { ClientConfig, AuthOptions } from "../../lib/types";

export class Auth {
  private accessToken: string | null = null;
  private sessionId: string | null = null;
  private readonly fetch: (url: string, init?: RequestInit) => Promise<Response>;

  constructor() {
    // Use unauthenticated fetch for auth endpoints
    this.fetch = createUnauthenticatedFetch('');
  }

  /**
   * Get or create an access token based on provided credentials
   * Implements priority-based resolution: accessToken > apiKey
   */
  async getAccessToken(opts: ClientConfig): Promise<string> {
    const { accessToken, apiKey, authBaseUrl, workflowId } = opts;

    if (accessToken) {
      if (!this.isSessionValid(accessToken)) {
        throw new AiolaError({
          message: "Provided access token is expired",
          code: "TOKEN_EXPIRED"
        });
      }
      return accessToken;
    }

    // Priority 2: API Key (requires token generation)
    if (apiKey) {
      const session = await this.getOrCreateSession({
        apiKey,
        baseUrl: authBaseUrl,
        workflowId
      });
      if (session) {
        this.accessToken = session.accessToken;
        this.sessionId = session.sessionId;
        return session.accessToken;
      }
    }

    throw new AiolaError({
      message: "No valid credentials provided. Please provide either apiKey or accessToken. You can generate an accessToken using AiolaClient.grantToken(apiKey).",
      code: "MISSING_CREDENTIALS"
    });
  }

  /**
   * Generate and return a new access token using the provided API key
   * This is a public method that clients can use to get an access token directly
   * This method always generates a fresh token and does not use cached sessions
   * 
   * @param opts - The configuration options
   * @returns Promise<string> - The generated access token
   */
  async grantToken(opts: Required<AuthOptions>): Promise<string> {
    return Auth.grantToken(opts);
  }

  /**
   * Static method to generate an access token from an API key without creating an Auth instance
   * This is the recommended way to generate tokens in backend services
   * 
   * @param opts - The configuration options
   * @returns Promise<string> - The generated access token
   */
  static async grantToken(opts: Required<AuthOptions>): Promise<string> {
    if (!opts.apiKey) {
      throw new AiolaError({
        message: "API key is required to generate access token",
        code: "MISSING_API_KEY"
      });
    }

    try {
      const { baseUrl, workflowId, apiKey } = opts;

      const tokenEndpoint = `${baseUrl}/voip-auth/apiKey2Token`;
      const sessionEndpoint = `${baseUrl}/voip-auth/session`;
      
      // Create fetch function
      const fetchFn = createUnauthenticatedFetch(baseUrl);

      // Generate temporary token
      const tokenResponse = await fetchFn(tokenEndpoint, {  
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      const tokenData = await tokenResponse.json();
      console.log("tokenData", tokenData);
      if (!tokenData.context?.token) {
        throw new AiolaError({
          message: "Invalid token response - no token found in data.context.token",
          code: "INVALID_TOKEN_RESPONSE"
        });
      }

      const sessionResponse = await fetchFn(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenData.context.token}`
        },
        body: JSON.stringify({ workflow_id: workflowId })
      });

      const sessionData = await sessionResponse.json();
      console.log("sessionData", sessionData);
      if (!sessionData.jwt) {
        throw new AiolaError({
          message: "Invalid session response - no jwt found",
          code: "INVALID_SESSION_RESPONSE"
        });
      }

      return sessionData.jwt;
    } catch (error) {
      if (error instanceof AiolaError) {
        throw error;
      }
      throw new AiolaError({
        message: `Token generation failed: ${(error as Error).message}`,
        code: "TOKEN_GENERATION_ERROR",
        details: error
      });
    }
  }

  /**
   * Generate a temporary JWT token from API key
   */
  async apiKeyToToken(opts: Required<AuthOptions>): Promise<string> {
    const { apiKey, baseUrl } = opts;

    try {
      const tokenEndpoint = `${baseUrl}/voip-auth/apiKey2Token`;
      const response = await this.fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      const data = await response.json();
      if (!data.context?.token) {
        throw new AiolaError({
          message: "Invalid token response - no token found in data.context.token",
          code: "INVALID_TOKEN_RESPONSE"
        });
      }

      return data.context.token;
    } catch (error) {
      if (error instanceof AiolaError) {
        throw error;
      }
      throw new AiolaError({
        message: `Token generation failed: ${(error as Error).message}`,
        code: "TOKEN_GENERATION_ERROR",
        details: error
      });
    }
  }

  /**
   * Create an access token (session JWT) using the temporary token
   */
  async createSession(token: string, workflowId: string, baseUrl: string): Promise<{accessToken: string, sessionId: string}> {
    try {
      const body = { workflow_id: workflowId };
      const sessionEndpoint = `${baseUrl}/voip-auth/session`;

      const response = await this.fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!data.jwt) {
        throw new AiolaError({
          message: "Invalid session response - no jwt found",
          code: "INVALID_SESSION_RESPONSE"
        });
      }

      return {accessToken: data.jwt, sessionId: data.sessionId};
    } catch (error) {
      if (error instanceof AiolaError) {
        throw error;
      }
      throw new AiolaError({
        message: `Session creation failed: ${(error as Error).message}`,
        code: "SESSION_CREATION_ERROR",
        details: error
      });
    }
  }

  /**
   * Get cached session or create new one
   */
  private async getOrCreateSession(opts: Required<AuthOptions>): Promise<{accessToken: string, sessionId: string} | null> {
    // Check if cached session is still valid
    const { apiKey, workflowId, baseUrl } = opts;

    if (this.accessToken && this.isSessionValid(this.accessToken)) {
        return {accessToken: this.accessToken, sessionId: this.sessionId!};
    }
    
    // Create new session
    try {
      const token = await this.apiKeyToToken({ apiKey, baseUrl, workflowId });
      const session = await this.createSession(token, workflowId, baseUrl);

      // Cache the session
      this.accessToken = session.accessToken;
      this.sessionId = session.sessionId;
      
      return session;
    } catch (error) {
      // Clean up invalid cache entry
      this.accessToken = null;
      this.sessionId = null;
      throw error;
    }
  }

  /**
   * Check if session is still valid (not expired)
   */
  private isSessionValid(accessToken: string): boolean {
    const now = Math.floor(Date.now() / 1000); // Convert to seconds
    const bufferTime = 5 * 60; // 5 minutes buffer in seconds
    const decoded = this.parseJWTPayload(accessToken);
    return decoded.exp > (now + bufferTime);
  }

  /**
   * Clear specific session from cache
   */
  clearSession(): void {
    this.accessToken = null;
    this.sessionId = null;
  }

  /**
   * Parse JWT payload without verification (for expiration check)
   */
  private parseJWTPayload(token: string): {exp: number, iat: number} {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = parts[1];
      // Handle base64url encoding
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      
      let decoded: string;
      if (typeof atob !== 'undefined') {
        // Browser environment
        decoded = atob(padded);
      } else {
        // Node.js environment
        decoded = Buffer.from(padded, 'base64').toString('utf-8');
      }
      
      return JSON.parse(decoded);
    } catch (error) {
      throw new AiolaError({
        message: 'Failed to parse JWT token',
        code: 'INVALID_JWT',
        details: error
      });
    }
  }
}