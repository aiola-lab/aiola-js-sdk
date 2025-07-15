export interface SessionCloseResponse {
  status: string;
  deletedAt: string;
}

export interface GrantTokenResponse {
  accessToken: string;
  sessionId: string;
}

export interface JwtPayload {
  exp: number;
  iat: number;
}
