import { Socket } from "socket.io-client";
import { jest } from "@jest/globals";
import { AiolaStreamingClient } from "./index";

jest.mock("socket.io-client", () => {
  const mockSocketImpl = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    io: jest.fn().mockReturnValue(mockSocketImpl),
  };
});

describe("AiolaStreamingClient", () => {
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
      onTranscript: jest.fn(),
      onEvents: jest.fn(),
    },
  };

  let client: AiolaStreamingClient;

  beforeEach(() => {
    client = new AiolaStreamingClient(mockConfig);
    // Mock the startMicStreaming method
    jest.spyOn(client as any, "startMicStreaming").mockResolvedValue(undefined);
  });

  it("should initialize with correct configuration", () => {
    expect(client).toBeInstanceOf(AiolaStreamingClient);
  });

  describe("startStreaming", () => {
    it("should initialize socket connection and audio streaming", async () => {
      await client.startStreaming();

      // Verify socket.io initialization
      expect(require("socket.io-client").io).toHaveBeenCalledWith(
        expect.stringContaining(mockConfig.baseUrl),
        expect.objectContaining({
          path: "/api/voice-streaming/socket.io",
          transports: ["polling", "websocket"],
          extraHeaders: {
            Authorization: `Bearer ${mockConfig.bearer}`,
          },
          transportOptions: {
            polling: {
              extraHeaders: { Authorization: `Bearer ${mockConfig.bearer}` },
            },
            websocket: {
              extraHeaders: { Authorization: `Bearer ${mockConfig.bearer}` },
            },
          },
        })
      );

      // Verify startMicStreaming was called
      expect((client as any).startMicStreaming).toHaveBeenCalledWith(
        mockConfig.micConfig
      );
    });
  });

  describe("stopStreaming", () => {
    it("should clean up resources", async () => {
      await client.startStreaming();
      client.stopStreaming();

      const socket = require("socket.io-client").io();
      expect(socket.disconnect).toHaveBeenCalled();
    });
  });
});
