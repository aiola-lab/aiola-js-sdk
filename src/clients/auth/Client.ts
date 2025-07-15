import { AiolaError } from "../../lib/errors";
import { createUnauthenticatedFetch } from "../../lib/fetch";
import {
  ClientConfig,
  AuthOptions,
  SessionCloseResponse,
  GrantTokenResponse,
  JwtPayload,
} from "../../lib/types";

export class Auth {
  private readonly fetch: (
    url: string,
    init?: RequestInit,
  ) => Promise<Response>;

  constructor() {
    // Use unauthenticated fetch for auth endpoints
    this.fetch = createUnauthenticatedFetch("");
  }

  /**
   * Get access token from client configuration
   * Now only accepts access tokens - API key support removed
   */
  async getAccessToken(opts: ClientConfig): Promise<string> {
    const { accessToken } = opts;

    if (!this.isSessionValid(accessToken)) {
      throw new AiolaError({
        message: "Provided access token is expired. Please generate a new token using AiolaClient.grantToken()",
        code: "TOKEN_EXPIRED",
      });
    }

    return accessToken;
  }


  /**
   * Generate an access token from an API key
   * Server handles concurrency limits and will return appropriate errors
   *
   * @param opts - The configuration options
   * @returns Promise<GrantTokenResponse> - The generated access token
   */
  static async grantToken(
    opts: Required<AuthOptions>,
  ): Promise<GrantTokenResponse> {
    if (!opts.apiKey) {
      throw new AiolaError({
        message: "API key is required to generate access token",
        code: "MISSING_API_KEY",
      });
    }

    try {
      const { authBaseUrl, workflowId, apiKey } = opts;
      const fetch = createUnauthenticatedFetch(authBaseUrl);

      // Step 1: Generate temporary token
      const tokenResponse = await fetch(`${authBaseUrl}/voip-auth/apiKey2Token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!tokenResponse.ok) {
        // Check if this is a concurrency limit error (409 Conflict)
        const errorData = await tokenResponse.json().catch(() => null);
        
        if (tokenResponse.status === 409 || (errorData && errorData.code === "MAX_CONCURRENCY_REACHED")) {
          throw new AiolaError({
            message: errorData?.message || "Max concurrency limit reached for API key. Please wait for existing sessions to expire or close them manually.",
            code: "MAX_CONCURRENCY_REACHED",
            details: errorData,
          });
        }
        
        throw new AiolaError({
          message: `Token generation failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
          code: "TOKEN_GENERATION_ERROR",
        });
      }

      const tokenData = await tokenResponse.json();
      if (!tokenData.context?.token) {
        throw new AiolaError({
          message: "Invalid token response - no token found in data.context.token",
          code: "INVALID_TOKEN_RESPONSE",
        });
      }

      // Step 2: Create session
      const sessionResponse = await fetch(`${authBaseUrl}/voip-auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.context.token}`,
        },
        body: JSON.stringify({ workflow_id: workflowId }),
      });

      if (!sessionResponse.ok) {
        // Check if this is a concurrency limit error (409 Conflict)
        const errorData = await sessionResponse.json().catch(() => null);
        
        if (sessionResponse.status === 409 || (errorData && errorData.code === "MAX_CONCURRENCY_REACHED")) {
          throw new AiolaError({
            message: errorData?.message || "Max concurrency limit reached for API key. Please wait for existing sessions to expire or close them manually.",
            code: "MAX_CONCURRENCY_REACHED",
            details: errorData,
          });
        }
        
        throw new AiolaError({
          message: `Session creation failed: ${sessionResponse.status} ${sessionResponse.statusText}`,
          code: "SESSION_CREATION_ERROR",
        });
      }

      const sessionData = await sessionResponse.json();
      if (!sessionData.jwt) {
        throw new AiolaError({
          message: "Invalid session response - no jwt found",
          code: "INVALID_SESSION_RESPONSE",
        });
      }

      return {
        accessToken: sessionData.jwt,
        sessionId: sessionData.sessionId,
      };
    } catch (error) {
      if (error instanceof AiolaError) {
        throw error;
      }
      throw new AiolaError({
        message: `Token generation failed: ${(error as Error).message}`,
        code: "TOKEN_GENERATION_ERROR",
        details: error,
      });
    }
  }

  /**
   * Generate a temporary JWT token from API key
   */
  async apiKeyToToken(opts: Required<AuthOptions>): Promise<string> {
    const { apiKey, authBaseUrl } = opts;

    try {
      const tokenEndpoint = `${authBaseUrl}/voip-auth/apiKey2Token`;
      const response = await this.fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();

      if (!data.context?.token) {
        throw new AiolaError({
          message:
            "Invalid token response - no token found in data.context.token",
          code: "INVALID_TOKEN_RESPONSE",
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
        details: error,
      });
    }
  }

  /**
   * Create an access token (session JWT) using the temporary token
   */
  async createSession(
    token: string,
    workflowId: string,
    authBaseUrl: string,
  ): Promise<GrantTokenResponse> {
    try {
      const body = { workflow_id: workflowId };
      const sessionEndpoint = `${authBaseUrl}/voip-auth/session`;

      const response = await this.fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.jwt) {
        throw new AiolaError({
          message: "Invalid session response - no jwt found",
          code: "INVALID_SESSION_RESPONSE",
        });
      }

      return { accessToken: data.jwt, sessionId: data.sessionId };
    } catch (error) {
      if (error instanceof AiolaError) {
        throw error;
      }
      throw new AiolaError({
        message: `Session creation failed: ${(error as Error).message}`,
        code: "SESSION_CREATION_ERROR",
        details: error,
      });
    }
  }

  /**
   * Close a session
   */
  static async closeSession(
    accessToken: string,
    opts: Required<AuthOptions>,
  ): Promise<SessionCloseResponse> {
    try {
      const { authBaseUrl } = opts;
      const sessionEndpoint = `${authBaseUrl}/voip-auth/session`;

      const response = await createUnauthenticatedFetch(authBaseUrl)(
        sessionEndpoint,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json();

      return data;
    } catch (error) {
      throw new AiolaError({
        message: `Session closing failed: ${(error as Error).message}`,
        code: "SESSION_CLOSING_ERROR",
        details: error,
      });
    }
  }


  /**
   * Check if session is still valid (not expired)
   */
  private isSessionValid(accessToken: string): boolean {
    const now = Math.floor(Date.now() / 1000); // Convert to seconds
    const bufferTime = 5 * 60; // 5 minutes buffer in seconds
    const decoded = this.parseJWTPayload(accessToken);
    return decoded.exp > now + bufferTime;
  }

  /**
   * Static method to check if a token is still valid
   */
  static isTokenValid(accessToken: string): boolean {
    try {
      const decoded = Auth.parseJWTPayload(accessToken);
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 5 * 60; // 5 minutes buffer
      return decoded.exp > now + bufferTime;
    } catch {
      return false;
    }
  }


  /**
   * Parse JWT payload without verification (for expiration check)
   */
  private parseJWTPayload(token: string): JwtPayload {
    return Auth.parseJWTPayload(token);
  }

  /**
   * Static method to parse JWT payload without verification (for expiration check)
   */
  static parseJWTPayload(token: string): JwtPayload {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const payload = parts[1];
      // Handle base64url encoding
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );

      let decoded: string;
      if (typeof atob !== "undefined") {
        // Browser environment
        decoded = atob(padded);
      } else {
        // Node.js environment
        decoded = Buffer.from(padded, "base64").toString("utf-8");
      }

      return JSON.parse(decoded);
    } catch (error) {
      throw new AiolaError({
        message: "Failed to parse JWT token",
        code: "INVALID_JWT",
        details: error,
      });
    }
  }
}
