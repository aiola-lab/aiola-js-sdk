"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const index_1 = __importDefault(require("./index"));
globals_1.jest.mock("socket.io-client", () => {
    const mockSocketImpl = {
        on: globals_1.jest.fn(),
        emit: globals_1.jest.fn(),
        disconnect: globals_1.jest.fn(),
    };
    return {
        io: globals_1.jest.fn().mockReturnValue(mockSocketImpl),
    };
});
(0, globals_1.describe)("AiolaStreamingClient", () => {
    const mockConfig = {
        baseUrl: "https://test.aiola.com",
        namespace: "/test",
        bearer: "test-token",
        queryParams: {},
        micConfig: {
            sampleRate: 16000,
            chunkSize: 4096,
            channels: 1,
        },
        events: {
            onTranscript: globals_1.jest.fn(),
            onEvents: globals_1.jest.fn(),
        },
    };
    let client;
    (0, globals_1.beforeEach)(() => {
        client = new index_1.default(mockConfig);
        // Mock the startMicStreaming method
        globals_1.jest.spyOn(client, "startMicStreaming").mockResolvedValue(undefined);
    });
    (0, globals_1.it)("should initialize with correct configuration", () => {
        (0, globals_1.expect)(client).toBeInstanceOf(index_1.default);
    });
    (0, globals_1.describe)("startStreaming", () => {
        (0, globals_1.it)("should initialize socket connection and audio streaming", async () => {
            await client.startStreaming();
            // Verify socket.io initialization
            (0, globals_1.expect)(require("socket.io-client").io).toHaveBeenCalledWith(globals_1.expect.stringContaining(mockConfig.baseUrl), globals_1.expect.objectContaining({
                path: "/api/voice-streaming/socket.io",
                extraHeaders: { Authorization: mockConfig.bearer },
            }));
            // Verify startMicStreaming was called
            (0, globals_1.expect)(client.startMicStreaming).toHaveBeenCalledWith(mockConfig.micConfig);
        });
    });
    (0, globals_1.describe)("stopStreaming", () => {
        (0, globals_1.it)("should clean up resources", async () => {
            await client.startStreaming();
            client.stopStreaming();
            const socket = require("socket.io-client").io();
            (0, globals_1.expect)(socket.disconnect).toHaveBeenCalled();
        });
    });
});
