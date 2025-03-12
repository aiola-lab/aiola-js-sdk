import { jest } from "@jest/globals";
import {
  AiolaStreamingClient,
  AiolaSocketError,
  AiolaSocketErrorCode,
  AiolaSocketNamespace,
} from "./index";

// Mock socket.io-client
jest.mock("socket.io-client", () => {
  return {
    io: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
      connected: false,
      disconnect: jest.fn(),
    }),
  };
});

// Mock AudioContext and related APIs
const mockAudioContext = {
  createMediaStreamSource: jest.fn(),
  audioWorklet: {
    addModule: jest.fn(),
  },
  close: jest.fn(),
};

const mockAudioWorkletNode = {
  port: { onmessage: jest.fn() },
  connect: jest.fn(),
};

// Mock window.AudioContext
global.AudioContext = jest
  .fn()
  .mockImplementation(() => mockAudioContext) as any;
global.AudioWorkletNode = jest
  .fn()
  .mockImplementation(() => mockAudioWorkletNode) as any;

// Mock URL object
global.URL = {
  createObjectURL: jest.fn().mockReturnValue("blob:mock-url"),
  revokeObjectURL: jest.fn(),
} as any;

// Create mock MediaStream
const mockMediaStream = {
  getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
} as unknown as MediaStream;

// Create a properly typed mock function for getUserMedia
const mockGetUserMedia = jest.fn() as any;
mockGetUserMedia.mockResolvedValue(mockMediaStream);

// Mock getUserMedia using spyOn
if (!global.navigator) {
  (global as any).navigator = {};
}
if (!global.navigator.mediaDevices) {
  (global as any).navigator.mediaDevices = {};
}
jest
  .spyOn(global.navigator.mediaDevices, "getUserMedia")
  .mockImplementation(mockGetUserMedia);

// Mock TextEncoder
global.TextEncoder = class {
  encode(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str));
  }
} as any;

describe("AiolaStreamingClient", () => {
  let client: AiolaStreamingClient;
  let mockSocket: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Suppress console output for all tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      connected: false,
      disconnect: jest.fn(),
      once: jest.fn(),
    };
    (require("socket.io-client") as any).io.mockReturnValue(mockSocket);

    // Reset the mock implementation
    mockGetUserMedia.mockReset();
    mockGetUserMedia.mockResolvedValue(mockMediaStream);

    client = new AiolaStreamingClient({
      baseUrl: "https://test.com",
      namespace: AiolaSocketNamespace.EVENTS,
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
        onConnect: jest.fn(),
        onError: jest.fn(),
        onStartRecord: jest.fn(),
        onStopRecord: jest.fn(),
        onKeyWordSet: jest.fn(),
      },
    });
  });

  afterEach(() => {
    // Restore console output
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe("connect", () => {
    it("should handle socket initialization failure", async () => {
      // Mock io to return null
      (require("socket.io-client") as any).io.mockReturnValueOnce(null);

      await client.connect();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.NETWORK_ERROR,
          message: "Failed to initialize socket connection",
        })
      );
    });

    it("should handle socket connection error", async () => {
      await client.connect();

      // Simulate connection error
      const error = new Error("Connection failed");
      const connectErrorHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect_error"
      )[1];
      connectErrorHandler(error);

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.NETWORK_ERROR,
          message: expect.stringContaining("Socket connection error"),
        })
      );
    });
  });

  describe("startRecording", () => {
    it("should handle MIC_ERROR when socket is not connected", async () => {
      await client.startRecording();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: "Socket is not connected. Please call connect first.",
        })
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Socket is not connected")
      );
    });

    it("should initialize socket connection and start microphone", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      // Mock createMediaStreamSource
      mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      await client.startRecording();

      expect(mockSocket.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "connect_error",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "transcript",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "events",
        expect.any(Function)
      );
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(
        mockMediaStream
      );
      expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalledWith(
        expect.stringContaining("blob:")
      );
      expect(mockMicSource.connect).toHaveBeenCalledWith(mockAudioWorkletNode);
    });

    it("should handle getUserMedia error", async () => {
      const error = new Error("Permission denied");
      mockGetUserMedia.mockRejectedValueOnce(error);

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      await client.startRecording();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: expect.stringContaining("Permission denied"),
        })
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Permission denied")
      );
      expect(client["config"].events.onStopRecord).toHaveBeenCalled();
    });

    it("should handle multiple start/stop cycles", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      // First cycle
      await client.startRecording();
      expect(client["config"].events.onStartRecord).toHaveBeenCalledTimes(1);
      expect(client["config"].events.onStopRecord).not.toHaveBeenCalled();

      client.stopRecording();
      expect(client["config"].events.onStopRecord).toHaveBeenCalledTimes(1);

      // Second cycle
      await client.startRecording();
      expect(client["config"].events.onStartRecord).toHaveBeenCalledTimes(2);
      expect(client["config"].events.onStopRecord).toHaveBeenCalledTimes(1);

      client.stopRecording();
      expect(client["config"].events.onStopRecord).toHaveBeenCalledTimes(2);
    });

    it("should call onStopRecord even if cleanup fails", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      // Mock createMediaStreamSource to throw an error
      mockAudioContext.createMediaStreamSource.mockImplementation(() => {
        throw new Error("Error");
      });

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      await client.startRecording();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: expect.stringContaining(
            "Error starting microphone recording"
          ),
        })
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error starting microphone recording")
      );
      expect(client["config"].events.onStopRecord).toHaveBeenCalled();
    });

    it("should handle microphone recording error", async () => {
      const error = new Error("Error starting microphone recording");
      mockAudioContext.createMediaStreamSource.mockImplementation(() => {
        throw error;
      });

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      await client.startRecording();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: expect.stringContaining(
            "Error starting microphone recording"
          ),
        })
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error starting microphone recording")
      );
    });

    it("should handle socket connection error and stop recording", async () => {
      // Start recording first
      await client.connect();
      mockSocket.connected = true;
      await client.startRecording();

      // Spy on stopRecording
      const stopRecordingSpy = jest.spyOn(client, "stopRecording");

      // Simulate connection error
      const error = new Error("Connection failed");
      const connectErrorHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect_error"
      )[1];
      connectErrorHandler(error);

      expect(stopRecordingSpy).toHaveBeenCalled();
      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.NETWORK_ERROR,
          message: expect.stringContaining("Socket connection error"),
        })
      );
    });

    it("should handle general socket error and stop recording", async () => {
      // Start recording first
      await client.connect();
      mockSocket.connected = true;
      await client.startRecording();

      // Spy on stopRecording
      const stopRecordingSpy = jest.spyOn(client, "stopRecording");

      // Simulate socket error
      const error = new Error("Socket error occurred");
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "error"
      )[1];
      errorHandler(error);

      expect(stopRecordingSpy).toHaveBeenCalled();
      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.GENERAL_ERROR,
          message: expect.stringContaining("Socket error"),
        })
      );
    });
  });

  describe("stopRecording", () => {
    it("should stop microphone and cleanup resources", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      await client.startRecording();
      client.stopRecording();

      expect(mockMicSource.disconnect).toHaveBeenCalled();
      expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(client["config"].events.onStopRecord).toHaveBeenCalled();
    });

    it("should handle microphone recording error", async () => {
      const error = new Error("Error stopping microphone recording");
      mockAudioContext.close.mockImplementation(() => {
        throw error;
      });

      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      // Start recording to set up the audio context
      await client.startRecording();

      // Now stop recording which should trigger the error
      client.stopRecording();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: expect.stringContaining(
            "Error stopping microphone recording"
          ),
        })
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error stopping microphone recording")
      );
    });
  });

  describe("closeSocket", () => {
    it("should disconnect socket", async () => {
      // Connect socket first
      await client.connect();
      mockSocket.connected = true;

      client.closeSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(client["socket"]).toBeNull();
    });
  });

  describe("setKeywords", () => {
    it("should throw KEYWORDS_ERROR for invalid input", () => {
      expect(() => client.setKeywords([])).toThrow(AiolaSocketError);
      expect(() => client.setKeywords([])).toThrow(
        "At least one valid keyword must be provided"
      );

      expect(() => client.setKeywords([""])).toThrow(AiolaSocketError);
      expect(() => client.setKeywords([""])).toThrow(
        "At least one valid keyword must be provided"
      );
    });

    it("should emit keywords when socket is connected", async () => {
      await client.connect();
      mockSocket.connected = true;

      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "set_keywords",
        expect.any(Uint8Array),
        expect.any(Function)
      );
    });

    it("should store keywords and not emit when socket is not connected", () => {
      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      expect(client.getActiveKeywords()).toEqual(keywords);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it("should handle successful keyword setting", async () => {
      await client.connect();
      mockSocket.connected = true;

      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      // Simulate successful response
      const callback = mockSocket.emit.mock.calls[0][2];
      callback({ status: "received" });

      expect(client["config"].events.onKeyWordSet).toHaveBeenCalledWith(
        keywords
      );
      expect(client["config"].events.onError).not.toHaveBeenCalled();
    });

    it("should handle keyword setting failure", async () => {
      await client.connect();
      mockSocket.connected = true;

      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      // Simulate error response
      const callback = mockSocket.emit.mock.calls[0][2];
      callback({ error: "Failed to set keywords" });

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.KEYWORDS_ERROR,
          message: expect.stringContaining("Failed to set keywords"),
        })
      );
    });

    it("should resend keywords on reconnection", async () => {
      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      await client.connect();

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect"
      )[1];
      mockSocket.connected = true;
      connectHandler();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "set_keywords",
        expect.any(Uint8Array),
        expect.any(Function)
      );
    });
  });
});
