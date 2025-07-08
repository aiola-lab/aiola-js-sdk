import { Auth } from "../../src/clients/auth/Client";
import { DEFAULT_WORKFLOW_ID, DEFAULT_AUTH_BASE_URL } from "../../src/lib/constants";
import { AiolaError } from "../../src/lib/errors";

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
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toBe(mockAccessToken);
      expect(mockStaticFetch).toHaveBeenCalledTimes(2);
    });

    it("should generate a new access token with custom baseUrl", async () => {
      const customBaseUrl = "https://custom.api.com";
      
      const result = await Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: customBaseUrl,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toBe(mockAccessToken);
      expect(mockCreateUnauthenticatedFetch).toHaveBeenCalledWith(customBaseUrl);
    });

    it("should generate a new access token with custom workflowId", async () => {
      const customWorkflowId = "custom_workflow_123";
      
      const result = await Auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: customWorkflowId
      });

      expect(result).toBe(mockAccessToken);
      // Check that the workflow ID was included in the session request
      const sessionCall = mockStaticFetch.mock.calls[1];
      expect(sessionCall[1].body).toContain(customWorkflowId);
    });

    it("should throw error when API key is not provided", async () => {
      await expect(Auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
      await expect(Auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
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
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
    });
  });

  describe("instance grantToken", () => {
    const mockApiKey = "ak_test123";
    const mockAccessToken = "access_token_456";

    it("should delegate to static method", async () => {
      // Spy on the static method
      const staticSpy = jest.spyOn(Auth, 'grantToken').mockResolvedValue(mockAccessToken);

      const result = await auth.grantToken({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      expect(result).toBe(mockAccessToken);
      expect(staticSpy).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      });

      staticSpy.mockRestore();
    });

    it("should throw error when API key is not provided", async () => {
      await expect(auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
      await expect(auth.grantToken({
        apiKey: "",
        baseUrl: DEFAULT_AUTH_BASE_URL,
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

    it("should throw error when neither apiKey nor accessToken is provided", async () => {
      await expect(auth.getAccessToken({
        baseUrl: "https://api.aiola.com",
        authBaseUrl: "https://auth.aiola.com",
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow(AiolaError);
      await expect(auth.getAccessToken({
        baseUrl: "https://api.aiola.com",
        authBaseUrl: "https://auth.aiola.com",
        workflowId: DEFAULT_WORKFLOW_ID
      })).rejects.toThrow("No valid credentials provided");
    });
  });
}); 