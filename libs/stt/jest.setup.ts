import "whatwg-fetch";
import { io } from "socket.io-client";

// Mock AudioContext and AudioWorkletNode
class MockAudioContext implements Partial<AudioContext> {
  createMediaStreamSource = jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    context: this,
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 2,
    channelCountMode: "explicit" as ChannelCountMode,
    channelInterpretation: "speakers" as ChannelInterpretation,
  }));
  audioWorklet = {
    addModule: jest.fn().mockReturnValue(Promise.resolve()),
  };
  destination = {} as AudioDestinationNode;
  currentTime = 0;
  sampleRate = 44100;
  state = "running" as AudioContextState;
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

// Mock AudioWorkletNode
class MockAudioWorkletNode implements Partial<AudioWorkletNode> {
  context: AudioContext;
  port: MessagePort;
  connect: jest.Mock;
  disconnect: jest.Mock;
  numberOfInputs: number;
  numberOfOutputs: number;
  channelCount: number;
  channelCountMode: ChannelCountMode;
  channelInterpretation: ChannelInterpretation;

  constructor(context: AudioContext) {
    this.context = context;
    this.port = {
      onmessage: jest.fn(),
      onmessageerror: jest.fn(),
      close: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as unknown as MessagePort;
    this.connect = jest.fn();
    this.disconnect = jest.fn();
    this.numberOfInputs = 1;
    this.numberOfOutputs = 1;
    this.channelCount = 2;
    this.channelCountMode = "explicit";
    this.channelInterpretation = "speakers";
  }
}

// Setup global mocks
(global as any).AudioContext = MockAudioContext;
(global as any).AudioWorkletNode = MockAudioWorkletNode;

// Mock navigator.mediaDevices
if (!global.navigator) {
  (global as any).navigator = {
    mediaDevices: {
      getUserMedia: jest
        .fn()
        .mockReturnValue(Promise.resolve({} as MediaStream)),
    },
  };
}

// Mock URL
global.URL = {
  createObjectURL: jest.fn().mockReturnValue("mock-url"),
  revokeObjectURL: jest.fn(),
} as any;

// Mock Blob
global.Blob = jest.fn().mockImplementation(() => ({}));

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

// Mock window.io
(global as any).window = {
  ...global.window,
  io,
};
