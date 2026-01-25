/**
 * Response from closing a session.
 */
export interface SessionCloseResponse {
  /** Status of the session closure operation */
  status: string;
  
  /** ISO 8601 timestamp when the session was deleted */
  deletedAt: string;
}

/**
 * Response from generating an access token.
 */
export interface GrantTokenResponse {
  /**
   * JWT access token for API authentication.
   * This token has an expiration time and should be validated before use.
   */
  accessToken: string;
  
  /**
   * Unique session identifier.
   * Can be used to track and close sessions.
   */
  sessionId: string;
}

/**
 * JWT token payload structure.
 * @internal
 */
export interface JwtPayload {
  /** Token expiration time (Unix timestamp in seconds) */
  exp: number;
  
  /** Token issued at time (Unix timestamp in seconds) */
  iat: number;
}
