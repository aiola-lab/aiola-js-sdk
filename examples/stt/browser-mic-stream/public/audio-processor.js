/**
 * AudioWorkletProcessor that converts Float32 audio samples (range -1..1)
 * to signed 16-bit PCM and forwards the raw ArrayBuffer to the main thread.
 */
const MAX_16BIT_INT = 0x7fff // 32767

class AudioProcessor extends AudioWorkletProcessor {
  /**
   * Called for each block of audio data.
   * @param {Float32Array[][]} inputs - Nested array of audio samples.
   * @returns {boolean} Return `true` to keep processor alive.
   */
  process(inputs) {
    // Expecting mono input
    const channelData = inputs?.[0]?.[0]
    if (!channelData) return true // Nothing to process yet.

    // Allocate target buffer and perform conversion.
    const int16Buffer = new Int16Array(channelData.length)
    for (let i = 0; i < channelData.length; i++) {
      // Clamp sample to [-1, 1] just in case, then scale.
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      int16Buffer[i] = sample * MAX_16BIT_INT
    }

    // Transfer the underlying ArrayBuffer to the main thread.
    this.port.postMessage({ audio_data: int16Buffer.buffer })

    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)