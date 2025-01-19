export const SDK_VERSION = '0.1.0';

export default class AiolaStreamingClient {
    constructor(config) {
      this.socket = null;
      this.audioContext = null;
      this.mediaStream = null;
      this.micSource = null;
      this.config = config;

      console.log(`AiolaStreamingClient SDK Version: ${SDK_VERSION}`);
    }
  
    async loadSocketIOLibrary() {
      if (!window.io) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.socket.io/4.5.0/socket.io.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      return window.io;
    }
  
    buildEndpoint() {
      const { baseUrl, namespace, queryParams } = this.config;
      const queryString = new URLSearchParams(queryParams).toString();
      return `${baseUrl}${namespace}?${queryString}`;
    }
  
    async startStreaming() {
      const io = await this.loadSocketIOLibrary();
      const endpoint = this.buildEndpoint();
      const { apiKey, micConfig, events, transports } = this.config;
  
      this.socket = io(endpoint, {
        transports: transports || ['polling', 'websocket'],
        path: '/api/voice-streaming/socket.io',
        transportOptions: {
          polling: {
            extraHeaders: { 'x-api-key': apiKey },
          },
          websocket: {
            extraHeaders: { 'x-api-key': apiKey },
          },
        },
      });
  
      this.socket.on('connect', () => console.log('Socket connected'));
      this.socket.on('disconnect', () => console.log('Socket disconnected'));
      this.socket.on('connect_error', (error) =>
        console.error('Socket connection error:', error)
      );
      this.socket.on('transcript', events.onTranscript);
      this.socket.on('events', events.onEvents);
  
      try {
        await this.startMicStreaming(micConfig);
      } catch (error) {
        console.error('Error starting microphone:', error);
      }
    }
  
    async startMicStreaming({ sampleRate, chunkSize, channels }) {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate });
      this.micSource = this.audioContext.createMediaStreamSource(this.mediaStream);
  
      // Define and register the audio processor as a separate module dynamically
      const processorCode = `
        class InlineAudioProcessor extends AudioWorkletProcessor {
          constructor(options) {
            super();
            this.chunkSize = options.processorOptions.chunkSize || 4096;
            this.buffer = [];
            this.processingPromise = Promise.resolve();
          }
  
          async waitForPreviousChunk() {
            await this.processingPromise;
          }
  
          async processChunk(chunk) {
            this.processingPromise = new Promise((resolve) => {
              this.port.postMessage(chunk);
              resolve();
            });
          }
  
          process(inputs) {
            const input = inputs[0];
            if (input && input[0]) {
              const audioData = input[0];
              this.buffer.push(...audioData);
  
              if (this.buffer.length >= this.chunkSize) {
                const chunk = this.buffer.slice(0, this.chunkSize);
                this.buffer = [];
                this.waitForPreviousChunk();
                this.processChunk(chunk);
              }
            }
            return true;
          }
        }
  
        registerProcessor('audio-processor', InlineAudioProcessor);
      `;
  
      // Create a Blob URL for the processor code
      const blob = new Blob([processorCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
  
      // Load the processor module dynamically
      await this.audioContext.audioWorklet.addModule(url);
  
      const audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor', {
        processorOptions: { chunkSize },
      });
  
      audioWorkletNode.port.onmessage = async (event) => {
        try {
          const chunk = event.data;
          const int16Array = this.float32ToInt16(chunk);
          this.socket.emit('binary_data', int16Array.buffer);
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      };
  
      this.micSource.connect(audioWorkletNode);
      console.log('Microphone streaming started');
    }
  
    async generateHash(arrayBuffer) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  
    stopStreaming() {
      if (this.micSource) this.micSource.disconnect();
      if (this.mediaStream) {
        const tracks = this.mediaStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (this.socket) this.socket.disconnect();
      console.log('Streaming stopped');
    }
  
    float32ToInt16(float32Array) {
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        int16Array[i] = Math.min(1, Math.max(-1, float32Array[i])) * 32767;
      }
      return int16Array;
    }
  }