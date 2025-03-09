import { jest } from "@jest/globals";
import { AiolaStreamingClient } from "./index";

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

describe("AiolaStreamingClient", () => {
  let client: AiolaStreamingClient;
  let mockSocket: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    // Suppress console output for all tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      connected: false,
      disconnect: jest.fn(),
    };
    (require("socket.io-client") as any).io.mockReturnValue(mockSocket);

    // Reset the mock implementation
    mockGetUserMedia.mockReset();
    mockGetUserMedia.mockResolvedValue(mockMediaStream);

    client = new AiolaStreamingClient({
      baseUrl: "https://test.com",
      namespace: "test",
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
      },
    });
  });

  afterEach(() => {
    // Restore console output
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe("startRecording", () => {
    it("should initialize socket connection and start microphone", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      // Mock createMediaStreamSource
      mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

      // Connect socket first
      await client.openSocket();
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
      await client.openSocket();
      mockSocket.connected = true;

      await expect(client.startRecording()).rejects.toThrow(
        "Permission denied"
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
      await client.openSocket();
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
      await client.openSocket();
      mockSocket.connected = true;

      // Expect the error to be thrown during startRecording
      await expect(client.startRecording()).rejects.toThrow("Error");

      // Verify that onStopRecord was called despite the error
      expect(client["config"].events.onStopRecord).toHaveBeenCalled();
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
      await client.openSocket();
      mockSocket.connected = true;

      await client.startRecording();
      client.stopRecording();

      expect(mockMicSource.disconnect).toHaveBeenCalled();
      expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(client["config"].events.onStopRecord).toHaveBeenCalled();
    });

    // it("should call onStopRecord even if cleanup fails", async () => {
    //   const mockMicSource = {
    //     connect: jest.fn(),
    //     disconnect: jest.fn().mockImplementation(() => {
    //       throw new Error("Disconnect failed");
    //     }),
    //   };

    //   mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

    //   // Connect socket first
    //   await client.openSocket();
    //   mockSocket.connected = true;

    //   await client.startRecording();

    //   // The error should be caught and handled internally
    //   client.stopRecording();

    //   // Verify that onStopRecord was called despite the error
    //   expect(client["config"].events.onStopRecord).toHaveBeenCalled();
    //   expect(mockAudioContext.close).toHaveBeenCalled();
    // });
  });

  describe("closeSocket", () => {
    it("should disconnect socket", async () => {
      // Connect socket first
      await client.openSocket();
      mockSocket.connected = true;

      client.closeSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(client["socket"]).toBeNull();
    });
  });

  describe("setKeywords", () => {
    it("should emit keywords when socket is connected", async () => {
      const mockMicSource = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      mockAudioContext.createMediaStreamSource.mockReturnValue(mockMicSource);

      // Connect socket first
      await client.openSocket();
      mockSocket.connected = true;

      await client.startRecording();

      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "set_keywords",
        JSON.stringify(keywords),
        expect.any(Function)
      );
    });

    it("should not emit keywords when socket is not connected", () => {
      const keywords = ["test", "keywords"];
      client.setKeywords(keywords);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
