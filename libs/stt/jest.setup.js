import "whatwg-fetch";
import { io } from "socket.io-client";

// Mock navigator.mediaDevices
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{
      stop: jest.fn()
    }]
  })
};

// Mock AudioContext and related APIs
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  audioWorklet: {
    addModule: jest.fn().mockResolvedValue(undefined)
  }
}));

global.AudioWorkletNode = jest.fn().mockImplementation(() => ({
  port: {
    onmessage: jest.fn(),
    postMessage: jest.fn()
  }
}));

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
