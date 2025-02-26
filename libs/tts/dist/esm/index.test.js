import AiolaTTSClient from "./index";
import { ReadableStream } from "web-streams-polyfill";
describe("AiolaTTSClient", () => {
    const mockConfig = {
        baseUrl: "https://test.aiola.com",
        bearer: "test-token",
        defaultVoice: "en-US-1",
    };
    let client;
    let originalFetch;
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
            const mockArrayBuffer = new ArrayBuffer(8);
            const mockResponse = {
                ok: true,
                status: 200,
                arrayBuffer: () => Promise.resolve(mockArrayBuffer),
            };
            global.fetch.mockResolvedValueOnce(mockResponse);
            const result = await client.synthesizeSpeech("Hello world");
            expect(global.fetch).toHaveBeenCalledWith(`${mockConfig.baseUrl}/api/tts/synthesize`, expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: mockConfig.bearer,
                },
                body: JSON.stringify({
                    text: "Hello world",
                    voice: mockConfig.defaultVoice,
                }),
            }));
            expect(result).toBe(mockArrayBuffer);
        });
        it("should throw error when API call fails", async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: "Bad Request",
            };
            global.fetch.mockResolvedValueOnce(mockResponse);
            await expect(client.synthesizeSpeech("Hello world")).rejects.toThrow("TTS synthesis failed: Bad Request");
        });
    });
    describe("streamSpeech", () => {
        it("should make correct API call for speech streaming", async () => {
            const mockStream = new ReadableStream();
            const mockResponse = {
                ok: true,
                status: 200,
                body: mockStream,
            };
            global.fetch.mockResolvedValueOnce(mockResponse);
            const result = await client.streamSpeech("Hello world");
            expect(global.fetch).toHaveBeenCalledWith(`${mockConfig.baseUrl}/api/tts/stream`, expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: mockConfig.bearer,
                },
                body: JSON.stringify({
                    text: "Hello world",
                    voice: mockConfig.defaultVoice,
                }),
            }));
            expect(result).toBe(mockStream);
        });
        it("should throw error when API call fails", async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: "Bad Request",
            };
            global.fetch.mockResolvedValueOnce(mockResponse);
            await expect(client.streamSpeech("Hello world")).rejects.toThrow("TTS streaming failed: Bad Request");
        });
        it("should throw error when response body is null", async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                body: null,
            };
            global.fetch.mockResolvedValueOnce(mockResponse);
            await expect(client.streamSpeech("Hello world")).rejects.toThrow("Response body is null");
        });
    });
});
