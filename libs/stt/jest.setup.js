import "whatwg-fetch";
import { io } from "socket.io-client";

// Mock AudioContext and AudioWorkletNode
class MockAudioContext {
  createMediaStreamSource = jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    context: this,
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
  }));
  audioWorklet = {
    addModule: jest.fn().mockReturnValue(Promise.resolve()),
  };
  destination = {};
  currentTime = 0;
  sampleRate = 44100;
  state = "running";
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

// Mock AudioWorkletNode
class MockAudioWorkletNode {
  constructor(context) {
    this.context = context;
    this.port = { onmessage: jest.fn() };
    this.connect = jest.fn();
    this.disconnect = jest.fn();
    this.numberOfInputs = 1;
    this.numberOfOutputs = 1;
    this.channelCount = 2;
    this.channelCountMode = 'explicit';
    this.channelInterpretation = 'speakers';
  }
}

// Setup global mocks
global.AudioContext = MockAudioContext;
global.AudioWorkletNode = MockAudioWorkletNode;

// Mock navigator.mediaDevices
if (!global.navigator) {
  global.navigator = {};
}

const mockGetUserMedia = jest.fn().mockReturnValue(Promise.resolve({} as MediaStream));

if (!navigator.mediaDevices) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    configurable: true,
    writable: true,
  });
}

// Mock URL
global.URL = {
  createObjectURL: jest.fn().mockReturnValue('mock-url'),
  revokeObjectURL: jest.fn()
} as any;

// Mock Blob
global.Blob = jest.fn().mockImplementation(() => ({}));

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Mock window.io
global.window = global.window || {};
global.window.io = io;
