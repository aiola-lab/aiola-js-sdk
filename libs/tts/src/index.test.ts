import AiolaTTSClient from "./index";
import { ReadableStream } from "web-streams-polyfill";

describe("AiolaTTSClient", () => {
  const mockConfig = {
    baseUrl: "https://test.aiola.com",
    bearer: "test-token",
    defaultVoice: "en-US-1",
  };

  let client: AiolaTTSClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new AiolaTTSClient(mockConfig);
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("synthesizeSpeech", () => {
    it("should make correct API call for speech synthesis", async () => {
      const mockBlob = new Blob(["mock audio data"], { type: "audio/wav" });
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({
          "Content-Type": "audio/wav",
        }),
        blob: () => Promise.resolve(mockBlob),
        json: () => Promise.resolve({}),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await client.synthesizeSpeech("Hello world");

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/api/tts/synthesize`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${mockConfig.bearer}`,
          },
          body: expect.any(URLSearchParams),
        })
      );

      expect(result).toBe(mockBlob);
    });

    it("should throw error when API call fails", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers(),
        json: () => Promise.resolve({ detail: "Invalid request" }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(client.synthesizeSpeech("Hello world")).rejects.toThrow(
        "Invalid request"
      );
    });
  });

  describe("streamSpeech", () => {
    it("should make correct API call for speech streaming", async () => {
      const mockStream = new ReadableStream();
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob()),
        json: () => Promise.resolve({}),
        body: mockStream,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await client.streamSpeech("Hello world");

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/api/tts/synthesize/stream`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${mockConfig.bearer}`,
          },
          body: expect.any(URLSearchParams),
        })
      );

      expect(result).toBeInstanceOf(ReadableStream);
    });

    it("should throw error when API call fails", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers(),
        json: () => Promise.resolve({ detail: "Invalid request" }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(client.streamSpeech("Hello world")).rejects.toThrow(
        "Invalid request"
      );
    });

    it("should throw error when response body is null", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob()),
        json: () => Promise.resolve({}),
        body: null,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(client.streamSpeech("Hello world")).rejects.toThrow(
        "Response body is null"
      );
    });
  });
});
