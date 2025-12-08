/**
 * AudioWorkletProcessor that resamples audio to 16kHz and converts Float32 audio samples (range -1..1)
 * to signed 16-bit PCM, buffering them into chunks of 4096 samples before sending.
 * 
 * Handles Safari's behavior where AudioContext uses native device sample rate (44.1/48kHz)
 * instead of the requested 16kHz, by implementing linear interpolation resampling.
 */
const MAX_16BIT_INT = 0x7fff // 32767
const CHUNK_SIZE = 4096
const TARGET_SAMPLE_RATE = 16000

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Int16Array(CHUNK_SIZE)
    this.bufferIndex = 0
    
    // Resampling state
    this.inputSampleRate = sampleRate // Actual sample rate from AudioContext
    this.resamplingRatio = this.inputSampleRate / TARGET_SAMPLE_RATE
    this.samplePosition = 0 // Position in the input stream (can be fractional)
    this.previousSample = 0 // For interpolation across process() calls
    this.isFirstBlock = true
    
    // Log the sample rate information
    console.log(`[AudioProcessor] Input sample rate: ${this.inputSampleRate}Hz`)
    console.log(`[AudioProcessor] Target sample rate: ${TARGET_SAMPLE_RATE}Hz`)
    console.log(`[AudioProcessor] Resampling ratio: ${this.resamplingRatio.toFixed(4)}`)
  }

  /**
   * Clamp a sample to [-1, 1] range and convert to 16-bit PCM integer
   * @param {number} sample - Float32 sample value
   * @returns {number} 16-bit PCM integer value
   */
  clampAndConvertTo16BitPCM(sample) {
    const clampedSample = Math.max(-1, Math.min(1, sample))
    return clampedSample * MAX_16BIT_INT
  }

  /**
   * Add a sample to the buffer, and flush if full
   * @param {number} pcmValue - 16-bit PCM integer value to add to buffer
   */
  addToBufferAndFlushIfFull(pcmValue) {
    this.buffer[this.bufferIndex] = pcmValue
    this.bufferIndex++

    // If buffer is full, send it and reset
    if (this.bufferIndex >= CHUNK_SIZE) {
      this.port.postMessage({ audio_data: this.buffer.buffer.slice(0) })
      this.buffer = new Int16Array(CHUNK_SIZE)
      this.bufferIndex = 0
    }
  }

  /**
   * Called for each block of audio data.
   * @param {Float32Array[][]} inputs - Nested array of audio samples.
   * @returns {boolean} Return `true` to keep processor alive.
   */
  process(inputs) {
    // Expecting mono input
    const channelData = inputs?.[0]?.[0]
    if (!channelData || channelData.length === 0) return true // Nothing to process yet.

    // If no resampling needed (already at 16kHz), use direct processing
    if (Math.abs(this.resamplingRatio - 1.0) < 0.01) {
      return this.processDirect(channelData)
    }

    // Process with resampling
    return this.processWithResampling(channelData)
  }

  /**
   * Direct processing when no resampling is needed (input is already ~16kHz)
   */
  processDirect(channelData) {
    for (let i = 0; i < channelData.length; i++) {
      const pcmValue = this.clampAndConvertTo16BitPCM(channelData[i])
      this.addToBufferAndFlushIfFull(pcmValue)
    }
    return true
  }

  /**
   * Processing with linear interpolation resampling
   */
  processWithResampling(channelData) {
    let inputIndex = 0
    
    // Continue from where we left off in the previous block
    while (inputIndex < channelData.length) {
      // Calculate the current position in the input
      const currentIndex = Math.floor(this.samplePosition)
      const fraction = this.samplePosition - currentIndex
      
      // Get samples for interpolation
      let sample1, sample2
      
      if (currentIndex < channelData.length) {
        sample1 = this.isFirstBlock && currentIndex === 0 ? channelData[0] : 
                  currentIndex === 0 ? this.previousSample : channelData[currentIndex]
        sample2 = currentIndex + 1 < channelData.length ? 
                  channelData[currentIndex + 1] : channelData[currentIndex]
      } else {
        // We've consumed all input samples
        break
      }
      
      // Linear interpolation: output = sample1 * (1 - fraction) + sample2 * fraction
      const interpolatedSample = sample1 * (1 - fraction) + sample2 * fraction
      
      // Clamp and convert to 16-bit PCM, then add to buffer
      const pcmValue = this.clampAndConvertTo16BitPCM(interpolatedSample)
      this.addToBufferAndFlushIfFull(pcmValue)

      // Advance position by resampling ratio
      this.samplePosition += this.resamplingRatio
      inputIndex = Math.floor(this.samplePosition)
    }
    
    // Store the last sample for next block's interpolation
    this.previousSample = channelData[channelData.length - 1]
    
    // Adjust position for next block (subtract samples we've consumed)
    this.samplePosition -= channelData.length
    this.isFirstBlock = false
    
    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)