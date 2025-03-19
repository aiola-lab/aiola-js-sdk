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

      client.connect();

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.NETWORK_ERROR,
          message: "Failed to initialize socket connection",
        })
      );
    });

    it("should start recording automatically when autoRecord is true", async () => {
      // Connect with autoRecord set to true
      client.connect(true);

      // Simulate successful connection
      mockSocket.connected = true;
      const connectCallback = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect"
      )[1];
      await connectCallback();

      // Wait for any async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify that getUserMedia was called
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });

      // Verify that onStartRecord was called
      expect(client["config"].events.onStartRecord).toHaveBeenCalled();
    });

    it("should not start recording automatically when autoRecord is false", async () => {
      // Connect with autoRecord set to false (default)
      client.connect();

      // Simulate successful connection
      mockSocket.connected = true;
      const connectCallback = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect"
      )[1];
      await connectCallback();

      // Wait for any async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify that getUserMedia was not called
      expect(mockGetUserMedia).not.toHaveBeenCalled();

      // Verify that onStartRecord was not called
      expect(client["config"].events.onStartRecord).not.toHaveBeenCalled();
    });

    it("should call onConnect with websocket transport when using websocket", () => {
      // Mock the socket's transport name
      mockSocket.io = {
        engine: {
          transport: {
            name: "websocket",
          },
        },
      };

      client.connect();

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect"
      )[1];
      connectHandler();

      expect(client["config"].events.onConnect).toHaveBeenCalledWith(
        "websocket"
      );
    });

    it("should call onConnect with polling transport when using polling", () => {
      // Mock the socket's transport name
      mockSocket.io = {
        engine: {
          transport: {
            name: "polling",
          },
        },
      };

      client.connect();

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect"
      )[1];
      connectHandler();

      expect(client["config"].events.onConnect).toHaveBeenCalledWith("polling");
    });

    it("should call onConnect with polling transport when websocket upgrade fails", () => {
      // Create a new client with websocket transport configured
      const websocketClient = new AiolaStreamingClient({
        baseUrl: "https://test.com",
        namespace: AiolaSocketNamespace.EVENTS,
        bearer: "test-token",
        queryParams: {},
        transports: "websocket",
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

      // Mock the socket's transport name to simulate websocket upgrade failure
      mockSocket.io = {
        engine: {
          transport: {
            name: "polling", // Even though websocket was requested, it fell back to polling
          },
        },
      };

      websocketClient.connect();

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: [string, Function]) => call[0] === "connect"
      )[1];
      connectHandler();

      // Should still call onConnect with the actual transport being used (polling)
      expect(websocketClient["config"].events.onConnect).toHaveBeenCalledWith(
        "polling"
      );
    });

    it("should handle socket connection error", async () => {
      client.connect();

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
      client.connect();
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
      client.connect();
      mockSocket.connected = true;

      // Start recording and wait for it to complete
      await client.startRecording();

      // Verify error handling
      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: expect.stringContaining("Permission denied"),
        })
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Permission denied")
      );
      // We never started recording, so onStopRecord should not be called
      expect(client["config"].events.onStopRecord).not.toHaveBeenCalled();
      // onStartRecord should not be called when permissions are denied
      expect(client["config"].events.onStartRecord).not.toHaveBeenCalled();
    });

    it("should handle permission denied case", async () => {
      // Mock getUserMedia to simulate permission denied
      mockGetUserMedia.mockRejectedValueOnce(new Error("Permission denied"));

      // Connect socket first
      client.connect();
      mockSocket.connected = true;

      // Start recording and wait for it to complete
      await client.startRecording();

      // Verify that getUserMedia was called with correct parameters
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });

      // Verify error handling
      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.MIC_ERROR,
          message: expect.stringContaining("Permission denied"),
        })
      );

      // Verify that recording events are not called since we never got permission
      expect(client["config"].events.onStartRecord).not.toHaveBeenCalled();
      expect(client["config"].events.onStopRecord).not.toHaveBeenCalled();

      // Verify that no audio context was created
      expect(mockAudioContext.createMediaStreamSource).not.toHaveBeenCalled();
    });

    it("should only call onStartRecord after getUserMedia permissions are granted", async () => {
      // Connect socket first
      client.connect();
      mockSocket.connected = true;

      // Start recording and wait for it to complete
      await client.startRecording();

      // Verify onStartRecord is called after getUserMedia succeeds
      expect(client["config"].events.onStartRecord).toHaveBeenCalled();
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it("should handle multiple start/stop cycles", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

      // Connect socket first
      client.connect();
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
      client.connect();
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
      client.connect();
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
      client.connect();
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
      client.connect();
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
      client.connect();
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
      client.connect();
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
      client.connect();
      mockSocket.connected = true;

      client.closeSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(client["socket"]).toBeNull();
    });
  });

  describe("setKeywords", () => {
    it("should throw KEYWORDS_ERROR for invalid input", () => {
      expect(() => client.setKeywords(null as any)).toThrow(AiolaSocketError);
      expect(() => client.setKeywords(null as any)).toThrow(
        "Keywords must be a valid array"
      );

      expect(() => client.setKeywords(undefined as any)).toThrow(
        AiolaSocketError
      );
      expect(() => client.setKeywords(undefined as any)).toThrow(
        "Keywords must be a valid array"
      );

      expect(() => client.setKeywords([""])).toThrow(AiolaSocketError);
      expect(() => client.setKeywords([""])).toThrow(
        "At least one valid keyword must be provided"
      );
    });

    it("should clear keywords when empty array is provided", () => {
      // First set some keywords
      client.setKeywords(["test", "keywords"]);
      expect(client.getActiveKeywords()).toEqual(["test", "keywords"]);

      // Now clear them
      client.setKeywords([]);
      expect(client.getActiveKeywords()).toEqual([]);
    });

    it("should emit empty keywords to server when clearing keywords and socket is connected", () => {
      client.connect();
      mockSocket.connected = true;

      // Clear keywords
      client.setKeywords([]);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "set_keywords",
        expect.any(Uint8Array),
        expect.any(Function)
      );

      // Simulate successful response
      const callback = mockSocket.emit.mock.calls[0][2];
      callback({ status: "received" });

      expect(client["config"].events.onKeyWordSet).toHaveBeenCalledWith([]);
      expect(client["config"].events.onError).not.toHaveBeenCalled();
    });

    it("should handle server error when clearing keywords", () => {
      client.connect();
      mockSocket.connected = true;

      // Clear keywords
      client.setKeywords([]);

      // Simulate error response
      const callback = mockSocket.emit.mock.calls[0][2];
      callback({ error: "Failed to clear keywords" });

      expect(client["config"].events.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AiolaSocketErrorCode.KEYWORDS_ERROR,
          message: expect.stringContaining("Failed to clear keywords"),
        })
      );
    });

    it("should emit keywords when socket is connected", async () => {
      client.connect();
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
      client.connect();
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
      client.connect();
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

      client.connect();

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
