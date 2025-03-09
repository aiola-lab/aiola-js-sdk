class InlineAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunkSize =
      (options.processorOptions && options.processorOptions.chunkSize) || 4096;
    this.buffer = new Float32Array();
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
      const newBuffer = new Float32Array(this.buffer.length + audioData.length);
      newBuffer.set(this.buffer);
      newBuffer.set(audioData, this.buffer.length);
      this.buffer = newBuffer;

      if (this.buffer.length >= this.chunkSize) {
        const chunk = this.buffer.slice(0, this.chunkSize);
        this.buffer = this.buffer.slice(this.chunkSize);
        this.waitForPreviousChunk();
        this.processChunk(chunk);
      }
    }
    return true;
  }
}

registerProcessor("audio-processor", InlineAudioProcessor);
