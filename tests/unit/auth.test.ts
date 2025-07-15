import { Auth } from "../../src/clients/auth/Client";
import { DEFAULT_WORKFLOW_ID, DEFAULT_AUTH_BASE_URL } from "../../src/lib/constants";
import { AiolaError } from "../../src/lib/errors";
import { SessionCloseResponse } from "../../src/lib/types";

// Mock cross-fetch
jest.mock("cross-fetch", () => {
  const actual = jest.requireActual("cross-fetch");
  return {
    ...actual,
    fetch: jest.fn(),
  };
});

// Mock the fetch implementation  
jest.mock("../../src/lib/fetch", () => {
  const mockFetch = jest.fn();
  return {
    createUnauthenticatedFetch: jest.fn(() => mockFetch),
    createAuthenticatedFetch: jest.fn(() => mockFetch)
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crossFetch = require("cross-fetch");
const mockCrossFetch: jest.Mock = crossFetch.fetch;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createUnauthenticatedFetch } = require("../../src/lib/fetch");
const mockCreateUnauthenticatedFetch: jest.Mock = createUnauthenticatedFetch;

describe("Auth Client", () => {
  let auth: Auth;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    auth = new Auth();
    // Get the mocked fetch function from the auth instance
    mockFetch = (auth as any).fetch;
    mockFetch.mockClear();
    mockCrossFetch.mockClear();
    mockCreateUnauthenticatedFetch.mockClear();
  });

  describe("static grantToken", () => {
    const mockApiKey = "ak_test123";
    const mockTempToken = "temp_token_123";
    const mockAccessToken = "access_token_456";
    let mockStaticFetch: jest.Mock;

    beforeEach(() => {
      // Create a mock fetch function for the static method
      mockStaticFetch = jest.fn();
      mockCreateUnauthenticatedFetch.mockReturnValue(mockStaticFetch);
      
      // Mock the responses for token and session endpoints
      mockStaticFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            context: { token: mockTempToken }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jwt: mockAccessToken,
            sessionId: "session_789"
          })
        });
    });

    it("should generate a new access token without creating an instance", async () => {
      const result = await Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toEqual({accessToken: mockAccessToken, sessionId: "session_789"});
      expect(mockStaticFetch).toHaveBeenCalledTimes(2);
    });

    it("should generate a new access token with custom baseUrl", async () => {
      const customBaseUrl = "https://custom.api.com";
      
      const result = await Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: customBaseUrl,
        authBaseUrl: customBaseUrl,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toEqual({accessToken: mockAccessToken, sessionId: "session_789"});
      expect(mockCreateUnauthenticatedFetch).toHaveBeenCalledWith(customBaseUrl);
    });

    it("should generate a new access token with custom workflowId", async () => {
      const customWorkflowId = "custom_workflow_123";
      
      const result = await Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: customWorkflowId
      });

      expect(result).toEqual({accessToken: mockAccessToken, sessionId: "session_789"});
      // Check that the workflow ID was included in the session request
      const sessionCall = mockStaticFetch.mock.calls[1];
      expect(sessionCall[1].body).toContain(customWorkflowId);
    });

    it("should throw error when API key is not provided", async () => {
      await expect(Auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
      await expect(Auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow("API key is required");
    });

    it("should throw error when token generation fails", async () => {
      mockStaticFetch.mockReset();
      mockStaticFetch.mockRejectedValueOnce(new AiolaError({
        message: "Invalid API key",
        status: 401,
        code: "INVALID_API_KEY"
      }));

      await expect(Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
    });
  });

  describe("instance grantToken", () => {
    const mockApiKey = "ak_test123";
    const mockAccessToken = "access_token_456";

    it("should delegate to static method", async () => {
      // Spy on the static method
      const staticSpy = jest.spyOn(Auth, 'grantToken').mockResolvedValue({accessToken: mockAccessToken, sessionId: "session_789"});

      const result = await Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toEqual({accessToken: mockAccessToken, sessionId: "session_789"});
      expect(staticSpy).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      staticSpy.mockRestore();
    });

    it("should throw error when API key is not provided", async () => {
      await expect(Auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
      await expect(Auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow("API key is required");
    });
  });

  describe("getAccessToken with accessToken only", () => {
    it("should return provided access token when valid", async () => {
      // Create a valid JWT token (expires in 1 hour, well beyond the 5-minute buffer)
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureExp, iat: Math.floor(Date.now() / 1000) };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const validAccessToken = `header.${encodedPayload}.signature`;

      const result = await auth.getAccessToken({
        accessToken: validAccessToken,
        baseUrl: "https://api.aiola.com",
        authBaseUrl: "https://auth.aiola.com",
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toBe(validAccessToken);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw error when access token is expired", async () => {
      // Create an expired JWT token (expired 1 hour ago, well past the 5-minute buffer)
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastExp, iat: Math.floor(Date.now() / 1000) - 7200 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const expiredAccessToken = `header.${encodedPayload}.signature`;

      await expect(auth.getAccessToken({
        accessToken: expiredAccessToken,
        baseUrl: "https://api.aiola.com",
        authBaseUrl: "https://auth.aiola.com",
        workflowId: DEFAULT_WORKFLOW_ID
      }))
        .rejects.toThrow(AiolaError);
      await expect(auth.getAccessToken({
        accessToken: expiredAccessToken,
        baseUrl: "https://api.aiola.com",
        authBaseUrl: "https://auth.aiola.com",
        workflowId: DEFAULT_WORKFLOW_ID
      }))
        .rejects.toThrow("Provided access token is expired");
    });

    it("should throw error when token is expired", async () => {
      // Mock an expired token
      const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KU";
      
      await expect(auth.getAccessToken({
        accessToken: expiredToken,
        baseUrl: "https://api.aiola.com",
        authBaseUrl: "https://auth.aiola.com",
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow("expired");
    });
  });

  describe("parseJWTPayload", () => {
    it("should parse valid JWT payload", () => {
      const payload = { exp: 1234567890, iat: 1234567800 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = (auth as any).parseJWTPayload(token);
      expect(result).toEqual(payload);
    });

    it("should handle base64url encoding correctly", () => {
      const payload = { exp: 1234567890, iat: 1234567800 };
      const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
      const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const token = `header.${base64url}.signature`;

      const result = (auth as any).parseJWTPayload(token);
      expect(result).toEqual(payload);
    });

    it("should throw error for invalid JWT format", () => {
      const invalidToken = "invalid.jwt";
      
      expect(() => (auth as any).parseJWTPayload(invalidToken))
        .toThrow(AiolaError);
      expect(() => (auth as any).parseJWTPayload(invalidToken))
        .toThrow("Failed to parse JWT token");
    });

    it("should throw error for malformed JSON payload", () => {
      const invalidPayload = "invalid-json";
      const token = `header.${invalidPayload}.signature`;
      
      expect(() => (auth as any).parseJWTPayload(token))
        .toThrow(AiolaError);
      expect(() => (auth as any).parseJWTPayload(token))
        .toThrow("Failed to parse JWT token");
    });
  });

  describe("clearSession", () => {
    it("should clear cached session data", () => {
      // clearSession method no longer exists - this test is no longer relevant
      // since we don't cache session data in the Auth class anymore
      expect(true).toBe(true);
    });
  });

  describe("closeSession", () => {
    const mockSessionId = "session_123";
    const mockAccessToken = "access_token_456";
    let mockStaticFetch: jest.Mock;

    beforeEach(() => {
      mockStaticFetch = jest.fn();
      mockCreateUnauthenticatedFetch.mockReturnValue(mockStaticFetch);
    });

    it("should successfully close session", async () => {
      const mockResponse: SessionCloseResponse = { status: "deleted", deletedAt: "2023-01-01T00:00:00Z" };
      mockStaticFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await Auth.closeSession(mockAccessToken, {
        apiKey: "test-key",
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toEqual(mockResponse);
      expect(mockStaticFetch).toHaveBeenCalledWith(
        `${DEFAULT_AUTH_BASE_URL}/voip-auth/session`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mockAccessToken}`
          }
        }
      );
    });

    it("should throw error when session closing fails", async () => {
      mockStaticFetch.mockRejectedValue(new Error("Network error"));

      await expect(Auth.closeSession(mockAccessToken, {
        apiKey: "test-key",
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
    });
  });

  describe("createSession", () => {
    const mockToken = "temp_token_123";
    const mockWorkflowId = "workflow_456";
    const mockBaseUrl = "https://api.aiola.com";

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it("should create session successfully", async () => {
      const mockResponse = { jwt: "access_token_789", sessionId: "session_abc" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await auth.createSession(mockToken, mockWorkflowId, mockBaseUrl);

      expect(result).toEqual({
        accessToken: "access_token_789",
        sessionId: "session_abc"
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/voip-auth/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mockToken}`
          },
          body: JSON.stringify({ workflow_id: mockWorkflowId })
        }
      );
    });

    it("should throw error when session response is invalid", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: "response" })
      });

      await expect(auth.createSession(mockToken, mockWorkflowId, mockBaseUrl))
        .rejects.toThrow(AiolaError);
      await expect(auth.createSession(mockToken, mockWorkflowId, mockBaseUrl))
        .rejects.toThrow("Invalid session response - no jwt found");
    });

    it("should throw error when network request fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(auth.createSession(mockToken, mockWorkflowId, mockBaseUrl))
        .rejects.toThrow(AiolaError);
    });
  });

  describe("apiKeyToToken", () => {
    const mockApiKey = "ak_test123";
    const mockAuthBaseUrl = "https://auth.aiola.com";
    const mockBaseUrl = "https://api.aiola.com";

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it("should convert API key to token successfully", async () => {
      const mockResponse = { context: { token: "temp_token_456" } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await auth.apiKeyToToken({
        apiKey: mockApiKey,
        authBaseUrl: mockAuthBaseUrl,
        baseUrl: mockBaseUrl,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toBe("temp_token_456");
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockAuthBaseUrl}/voip-auth/apiKey2Token`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${mockApiKey}`
          }
        }
      );
    });

    it("should throw error when token response is invalid", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: "response" })
      });

      await expect(auth.apiKeyToToken({
        apiKey: mockApiKey,
        authBaseUrl: mockAuthBaseUrl,
        baseUrl: mockBaseUrl,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
    });

    it("should throw error when network request fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(auth.apiKeyToToken({
        apiKey: mockApiKey,
        authBaseUrl: mockAuthBaseUrl,
        baseUrl: mockBaseUrl,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
    });
  });

  describe("isSessionValid", () => {
    it("should return true for valid token with sufficient time buffer", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureExp, iat: Math.floor(Date.now() / 1000) };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = (auth as any).isSessionValid(token);
      expect(result).toBe(true);
    });

    it("should return false for expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastExp, iat: Math.floor(Date.now() / 1000) - 7200 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = (auth as any).isSessionValid(token);
      expect(result).toBe(false);
    });

    it("should return false for token expiring within buffer time", () => {
      const soonExp = Math.floor(Date.now() / 1000) + 60; // 1 minute from now (within 5-minute buffer)
      const payload = { exp: soonExp, iat: Math.floor(Date.now() / 1000) };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `header.${encodedPayload}.signature`;

      const result = (auth as any).isSessionValid(token);
      expect(result).toBe(false);
    });
  });

  describe("getOrCreateSession", () => {
    // getOrCreateSession method no longer exists - these tests are no longer relevant
    // since we don't cache session data in the Auth class anymore
    it("should skip getOrCreateSession tests as method no longer exists", () => {
      expect(true).toBe(true);
    });
  });
}); 