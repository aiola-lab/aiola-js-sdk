import { Tts } from "../../src/clients/tts/Client";
import { TtsRequest } from "../../src/lib/types";
import { AiolaError } from "../../src/lib/errors";
import { Auth } from "../../src/clients/auth/Client";
import { DEFAULT_WORKFLOW_ID } from "../../src/lib/constants";

// Helper type to avoid having to satisfy the full Fetch API Response type in tests
// We only need the properties accessed by the SDK (ok, body, status, statusText).
interface MinimalResponse {
  ok: boolean;
  body: unknown;
  status: number;
  statusText: string;
  clone: () => MinimalResponse;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

describe("Tts Client – public usage", () => {
  const options = { 
    accessToken: "test-token", 
    baseUrl: "https://api.aiola.com",
    authBaseUrl: "https://auth.aiola.com",
    workflowId: DEFAULT_WORKFLOW_ID
  } as const;
  const request: TtsRequest = { text: "Hello World", voice: "en-US-1", language: "en" };

  let tts: Tts;
  let mockAuth: jest.Mocked<Auth>;

  beforeEach(() => {
    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue("mock-access-token"),
      apiKeyToToken: jest.fn(),
      createSession: jest.fn(),
      clearSession: jest.fn(),
    } as any;
    
    tts = new Tts(options, mockAuth);
  });

  const makeMockResponse = (overrides: Partial<MinimalResponse> = {}): MinimalResponse => {
    const base: MinimalResponse = {
      ok: true,
      body: {},
      status: 200,
      statusText: "OK",
      clone() {
        // Return a shallow copy with the same methods so that successive reads do not fail.
        return makeMockResponse({ ...this });
      },
      json: async () => ({}),
      text: async () => "",
    };

    return { ...base, ...overrides };
  };

  it("stream() should send a POST request and return the response body on success", async () => {
    const mockBody = {};
    (tts as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue(makeMockResponse({ ok: true, body: mockBody }));

    const result = await tts.stream(request);

    // Validate the wrapper fetch was invoked correctly
    expect((tts as unknown as { fetch: jest.Mock }).fetch).toHaveBeenCalledWith("/api/tts/stream", {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        Accept: "audio/*",
      },
    });

    // Ensure the body is returned untouched
    expect(result).toBe(mockBody);
  });

  it("stream() should throw when the response is not ok", async () => {
    (tts as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockRejectedValue(new AiolaError({ message: "Bad Request", status: 400 }));

    await expect(tts.stream(request)).rejects.toBeInstanceOf(AiolaError);
  });

  it("synthesize() should send a POST request and return the response body on success", async () => {
    const mockBody = {};
    (tts as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue(makeMockResponse({ ok: true, body: mockBody }));

    const result = await tts.synthesize(request);

    expect((tts as unknown as { fetch: jest.Mock }).fetch).toHaveBeenCalledWith("/api/tts/synthesize", {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        Accept: "audio/*",
      },
    });

    expect(result).toBe(mockBody);
  });

  it("synthesize() should throw when the response is not ok", async () => {
    (tts as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockRejectedValue(new AiolaError({ message: "Server Error", status: 500 }));

    await expect(tts.synthesize(request)).rejects.toBeInstanceOf(AiolaError);
  });
}); 