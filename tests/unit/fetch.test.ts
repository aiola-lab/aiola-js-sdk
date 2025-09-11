import { createAuthenticatedFetch } from "../../src/lib/fetch";
import type { ClientConfig } from "../../src/lib/types";
import { Auth } from "../../src/clients/auth/Client";

// Mock runtime for User-Agent header
jest.mock("../../src/lib/runtime", () => ({
  RUNTIME: {
    type: 'node',
    version: '1.0.0'
  }
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

global.Headers = jest.fn().mockImplementation((init) => {
  const headers = new Map();
  if (init) {
    Object.entries(init).forEach(([key, value]) => {
      headers.set(key.toLowerCase(), value);
    });
  }
  return {
    set: (key: string, value: string) => headers.set(key.toLowerCase(), value),
    get: (key: string) => headers.get(key.toLowerCase()),
    has: (key: string) => headers.has(key.toLowerCase()),
    entries: () => headers.entries(),
    [Symbol.iterator]: () => headers.entries()
  };
});

// Return a resolved Promise by default
mockFetch.mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

describe("createAuthenticatedFetch", () => {
  const opts: ClientConfig = {
    accessToken: "secret-access-token",
    baseUrl: "https://api.aiola.com",
    authBaseUrl: "https://auth.aiola.com",
    workflowId: "default-workflow-id",
  };

  let mockAuth: jest.Mocked<Auth>;

  beforeEach(() => {
    mockFetch.mockClear();
    
    // Mock the Auth instance
    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue("mock-access-token"),
      apiKeyToToken: jest.fn(),
      createSession: jest.fn(),
      clearSession: jest.fn(),
    } as any;
  });

  it("prefixes baseUrl when given a relative path", async () => {
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("/v1/hello");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.aiola.com/v1/hello");
  });

  it("does not prefix when given an absolute URL", async () => {
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("https://example.com/other");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/other");
  });

  it("adds the Authorization header with access token", async () => {
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("/protected");

    expect(mockAuth.getAccessToken).toHaveBeenCalledWith(opts);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.get("Authorization")).toBe("Bearer mock-access-token");
  });

  it("does not add Content-Type for FormData requests", async () => {
    const mockFormData = {
      constructor: { name: 'FormData' },
      getHeaders: jest.fn(() => ({ 'content-type': 'multipart/form-data' }))
    };
    
    global.FormData = jest.fn(() => mockFormData) as any;
    
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("/api/upload", { method: "POST", body: new FormData() });

    const [, init] = mockFetch.mock.calls[0];
    // Should not add application/json Content-Type for FormData
    expect(init.headers.get("Content-Type")).not.toBe("application/json");
  });

  it("adds User-Agent header", async () => {
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("/test");

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.get("User-Agent")).toBe("@aiola/aiola-js/node/1.0.0");
  });

  it("preserves existing headers", async () => {
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("/test", { 
      headers: { 
        "Custom-Header": "custom-value",
        "Content-Type": "application/xml" 
      } 
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.get("Custom-Header")).toBe("custom-value");
    expect(init.headers.get("Content-Type")).toBe("application/xml");
    expect(init.headers.get("Authorization")).toBe("Bearer mock-access-token");
  });

  it("automatically adds application/json Content-Type for JSON requests", async () => {
    const fetch = createAuthenticatedFetch(opts, mockAuth);
    await fetch("/api/test", { 
      method: "POST",
      body: JSON.stringify({ test: "data" })
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.get("Content-Type")).toBe("application/json");
  });
});
