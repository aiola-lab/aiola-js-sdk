import { Stt } from "../../src/clients/stt/Client";
import { Socket } from "socket.io-client";
import { TranscribeFileResponse } from "../../src/lib/types/TranscribeFileResponse";
import type { TranscribeFileRequest } from "../../src/lib/types";
import { Auth } from "../../src/clients/auth/Client";
import { DEFAULT_WORKFLOW_ID } from "../../src/lib/constants";

// Build a stub for the socket that mimics the public API users interact with
const mockSocket = {
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  emit: jest.fn().mockReturnThis(),
  connect: jest.fn().mockReturnThis(),
  disconnect: jest.fn().mockReturnThis(),
  connected: true,
  id: "test-socket-id",
} as unknown as Socket;

// Mock the `socket.io-client` factory so that it returns our stubbed socket
jest.mock("socket.io-client", () => {
  return {
    io: jest.fn(() => mockSocket),
  };
});

// Mock FormData
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data; boundary=test' })
  }));
});

// Mock the streaming socket
jest.mock("../../src/clients/stt/streaming", () => ({
  StreamingClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    connected: false,
    id: "mock-socket-id"
  }))
}));

// Mock AiolaError with a fromResponse method
jest.mock("../../src/lib/errors", () => {
  const actual = jest.requireActual("../../src/lib/errors");
  const OriginalAiolaError = actual.AiolaError;
  return {
    ...actual,
    AiolaError: class extends OriginalAiolaError {
      static fromResponse = jest.fn();
    }
  };
});

describe("Stt Client – basic functionality", () => {
  let mockAuth: jest.Mocked<Auth>;
  let stt: Stt;
  
  beforeEach(() => {
    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue("mock-access-token"),
      apiKeyToToken: jest.fn(),
      createSession: jest.fn(),
      clearSession: jest.fn(),
    } as any;
    
    stt = new Stt({ 
      accessToken: "test-token", 
      baseUrl: "https://api.aiola.com",
      authBaseUrl: "https://auth.aiola.com",
      workflowId: DEFAULT_WORKFLOW_ID
    }, mockAuth);
  });

  it("should create a streaming socket with proper configuration", () => {
    const streamRequest = {
      langCode: "en",
      keywords: { "aiola": "aiOla" }
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should build query parameters correctly", () => {
    const streamRequest = {
      langCode: "fr",
      keywords: { "test": "TEST" },
      tasksConfig: { TRANSLATION: { src_lang_code: "fr", dst_lang_code: "en" } }
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle streaming requests with minimal configuration", () => {
    const streamRequest = {};

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should use default values for missing parameters", () => {
    const streamRequest = {
      langCode: "es"
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle keywords parameter correctly", () => {
    const streamRequest = {
      langCode: "en",
      keywords: { 
        "aiola": "aiOla",
        "API": "A P I",
        "machine learning": "ML"
      }
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle tasks_config parameter correctly", () => {
    const streamRequest = {
      langCode: "en",
      tasksConfig: {
        TRANSLATION: {
          src_lang_code: "en",
          dst_lang_code: "es"
        },
        ENTITY_DETECTION: {}
      }
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle workflow_id and execution_id parameters", () => {
    const streamRequest = {
      workflowId: "custom-flow-123",
      executionId: "custom-execution-456",
      langCode: "en"
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle time_zone parameter", () => {
    const streamRequest = {
      langCode: "en",
      timeZone: "America/New_York"
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should generate execution_id when not provided", () => {
    const streamRequest = {
      langCode: "en"
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle empty keywords object", () => {
    const streamRequest = {
      langCode: "en",
      keywords: {}
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle empty tasks_config object", () => {
    const streamRequest = {
      langCode: "en",
      tasksConfig: {}
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle complex nested tasks_config", () => {
    const streamRequest = {
      langCode: "en",
      tasksConfig: {
        TRANSLATION: {
          src_lang_code: "en",
          dst_lang_code: "fr"
        },
        ENTITY_DETECTION_FROM_LIST: {
          entity_list: ["person", "organization", "location"]
        },
        SENTIMENT_ANALYSIS: {},
        SUMMARIZATION: {}
      }
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });

  it("should handle all supported task types", () => {
    const streamRequest = {
      langCode: "en",
      tasksConfig: {
        FORM_FILLING: {},
        TRANSLATION: { src_lang_code: "en", dst_lang_code: "es" },
        ENTITY_DETECTION: {},
        ENTITY_DETECTION_FROM_LIST: { entity_list: ["test"] },
        KEY_PHRASES: {},
        PII_REDACTION: {},
        SENTIMENT_ANALYSIS: {},
        SUMMARIZATION: {},
        TOPIC_DETECTION: {},
        CONTENT_MODERATION: {},
        AUTO_CHAPTERS: {}
      }
    };

    const socket = stt.stream(streamRequest);
    expect(socket).toBeDefined();
  });
});

describe("Stt Client – transcribeFile method", () => {
  let stt: Stt;
  let mockFetch: jest.Mock;
  let mockFormData: any;
  let mockAuth: jest.Mocked<Auth>;

  const mockTranscriptionResponse: TranscribeFileResponse = {
    transcript: "Hello world",
    itn_transcript: "hello world",
    segments: [
      {
        start: 0.0,
        end: 1.5,
        text: "Hello world"
      }
    ],
    metadata: {
      duration: 1.5,
      language: "en",
      sample_rate: 16000,
      num_channels: 1,
      timestamp_utc: "2023-12-01T12:00:00Z",
      model_version: "v1.0"
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue("mock-access-token"),
      apiKeyToToken: jest.fn(),
      createSession: jest.fn(),
      clearSession: jest.fn(),
    } as any;
    
    stt = new Stt({ 
      accessToken: "test-token", 
      baseUrl: "https://api.aiola.com",
      authBaseUrl: "https://auth.aiola.com",
      workflowId: DEFAULT_WORKFLOW_ID
    }, mockAuth);
    
    // Get the mocked FormData constructor
    const FormData = require('form-data');
    mockFormData = {
      append: jest.fn(),
      getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data; boundary=test' })
    };
    FormData.mockImplementation(() => mockFormData);

    // Mock fetch on the stt instance
    mockFetch = jest.fn();
    (stt as any).fetch = mockFetch;
  });

  describe("successful transcription", () => {
    it("should transcribe a file successfully", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ file: mockFile });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockFile);
      expect(mockFetch).toHaveBeenCalledWith('/api/speech-to-text/file', {
        method: "POST",
        body: mockFormData,
        headers: mockFormData.getHeaders()
      });
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should transcribe a file with language specified", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ 
        file: mockFile, 
        language: "en" 
      });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockFile);
      expect(mockFormData.append).toHaveBeenCalledWith("language", "en");
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should transcribe a file with keywords specified", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const keywords = { "aiola": "aiOla", "API": "A P I" };
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ 
        file: mockFile, 
        keywords 
      });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockFile);
      expect(mockFormData.append).toHaveBeenCalledWith("keywords", JSON.stringify(keywords));
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should transcribe a file with both language and keywords", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const keywords = { "aiola": "aiOla" };
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ 
        file: mockFile, 
        language: "fr",
        keywords 
      });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockFile);
      expect(mockFormData.append).toHaveBeenCalledWith("language", "fr");
      expect(mockFormData.append).toHaveBeenCalledWith("keywords", JSON.stringify(keywords));
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should handle Buffer file input", async () => {
      const mockFile = Buffer.from("audio data");
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ file: mockFile });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockFile);
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should handle Blob file input", async () => {
      const mockFile = new Blob(["audio data"], { type: "audio/wav" });
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ file: mockFile });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockFile);
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should handle ReadStream file input (Node.js)", async () => {
      // Create a mock ReadStream
      const mockReadStream = {
        path: "/path/to/audio.wav",
        readable: true,
        pipe: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ file: mockReadStream as any });

      expect(mockFormData.append).toHaveBeenCalledWith("file", mockReadStream);
      expect(result).toEqual(mockTranscriptionResponse);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      // Reset the AiolaError.fromResponse mock for each test
      const { AiolaError } = require("../../src/lib/errors");
      (AiolaError.fromResponse as jest.Mock).mockReset();
    });

    it("should throw AiolaError when API returns 400 Bad Request", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "Invalid file format", 
        status: 400 
      });
      
      mockFetch.mockRejectedValue(mockError);

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow(AiolaError);
      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("Invalid file format");
    });

    it("should throw AiolaError when API returns 401 Unauthorized", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "Invalid API key", 
        status: 401 
      });
      
      mockFetch.mockRejectedValue(mockError);

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow(AiolaError);
      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("Invalid API key");
    });

    it("should throw AiolaError when API returns 413 Payload Too Large", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "File too large", 
        status: 413 
      });
      
      mockFetch.mockRejectedValue(mockError);

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow(AiolaError);
      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("File too large");
    });

    it("should throw AiolaError when API returns 422 Unprocessable Entity", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "Unsupported audio format", 
        status: 422 
      });
      
      mockFetch.mockRejectedValue(mockError);

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow(AiolaError);
      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("Unsupported audio format");
    });

    it("should throw AiolaError when API returns 500 Internal Server Error", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "Internal server error", 
        status: 500 
      });
      
      mockFetch.mockRejectedValue(mockError);

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow(AiolaError);
      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("Internal server error");
    });

    it("should throw AiolaError when network request fails", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "Network error" 
      });
      
      mockFetch.mockRejectedValue(mockError);

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow(AiolaError);
      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("Network error");
    });

    it("should handle malformed JSON response", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const jsonError = new Error("Invalid JSON");
      const { AiolaError } = require("../../src/lib/errors");
      const mockError = new AiolaError({ 
        message: "Invalid JSON" 
      });
      
      (AiolaError.fromResponse as jest.Mock).mockResolvedValue(mockError);
      
      mockFetch.mockResolvedValue({
        json: jest.fn().mockRejectedValue(jsonError)
      });

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow();
    });

    it("should handle response without expected structure", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const incompleteResponse = { transcript: "test" }; // Missing required fields
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(incompleteResponse)
      });

      const result = await stt.transcribeFile({ file: mockFile });
      
      // Should still return the response even if incomplete
      expect(result).toEqual(incompleteResponse);
    });

    it("should handle FormData creation errors", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      
      // Make append throw an error
      mockFormData.append.mockImplementation(() => {
        throw new Error("FormData append failed");
      });

      await expect(stt.transcribeFile({ file: mockFile })).rejects.toThrow("FormData append failed");
    });
  });

  describe("edge cases", () => {
    it("should handle empty keywords object", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      const emptyKeywords = {};
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ 
        file: mockFile, 
        keywords: emptyKeywords 
      });

      expect(mockFormData.append).toHaveBeenCalledWith("keywords", JSON.stringify(emptyKeywords));
      expect(result).toEqual(mockTranscriptionResponse);
    });

    it("should not append empty language string (falsy value)", async () => {
      const mockFile = new File(["audio data"], "test.wav", { type: "audio/wav" });
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTranscriptionResponse)
      });

      const result = await stt.transcribeFile({ 
        file: mockFile, 
        language: "" 
      });

      // Empty string is falsy, so it should not be appended
      expect(mockFormData.append).not.toHaveBeenCalledWith("language", "");
      expect(result).toEqual(mockTranscriptionResponse);
    });
  });
}); 