/**
 * AudioWorkletProcessor that converts Float32 audio samples (range -1..1)
 * to signed 16-bit PCM and buffers them into chunks of 4096 samples before sending.
 */
const MAX_16BIT_INT = 0x7fff // 32767
const CHUNK_SIZE = 4096

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Int16Array(CHUNK_SIZE)
    this.bufferIndex = 0
  }

  /**
   * Called for each block of audio data.
   * @param {Float32Array[][]} inputs - Nested array of audio samples.
   * @returns {boolean} Return `true` to keep processor alive.
   */
  process(inputs) {
    // Expecting mono input
    const channelData = inputs?.[0]?.[0]
    if (!channelData) return true // Nothing to process yet.

    // Process each sample in the input block
    for (let i = 0; i < channelData.length; i++) {
      // Clamp sample to [-1, 1] just in case, then scale.
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      this.buffer[this.bufferIndex] = sample * MAX_16BIT_INT
      this.bufferIndex++

      // If buffer is full, send it and reset
      if (this.bufferIndex >= CHUNK_SIZE) {
        this.port.postMessage({ audio_data: this.buffer.buffer.slice(0) })
        this.buffer = new Int16Array(CHUNK_SIZE)
        this.bufferIndex = 0
      }
    }

    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)