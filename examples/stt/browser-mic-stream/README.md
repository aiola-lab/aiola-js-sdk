# Browser Microphone Stream Example

This example demonstrates how to use the Aiola SDK to stream microphone audio from the browser for real-time speech-to-text transcription.

## Setup

0. **If you didn't build the SDK already, do it first:**
   ```bash
   cd ../../../
   npm run build
   cd examples/stt/browser-mic-stream
   ```

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and replace the placeholder values with your actual Aiola credentials:
   ```
   VITE_AIOLA_API_KEY=your_actual_api_key
   VITE_AIOLA_AUTH_BASE_URL=https://auth.aiola.com
   VITE_AIOLA_WORKFLOW_ID=your_actual_workflow_id
   VITE_AIOLA_BASE_URL=https://api.aiola.com
   ```

## Running the Example

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Click the **Connection** switch to connect to the Aiola streaming service
2. Once connected, click the **Recording** switch to start recording from your microphone
3. Speak into your microphone to see real-time transcriptions
4. Optionally, enter keywords (comma-separated) and click "Set Keywords" to enhance recognition
5. Click the switches again to stop recording and disconnect

## Features

- Real-time microphone audio streaming
- Live speech-to-text transcription
- Keyword enhancement for improved accuracy
- Visual connection and recording status indicators
- **Automatic audio resampling** for Safari and other browsers

## Browser Compatibility

### Safari Audio Sample Rate Handling

This application is fully compatible with Safari and handles a known Safari behavior regarding audio sample rates:

**The Issue:**
Safari's Web Audio API ignores the requested 16kHz sample rate and instead uses the device's native audio sample rate (typically 44.1kHz or 48kHz). The Aiola voice API requires audio at exactly 16kHz for optimal speech recognition.

**Our Solution:**
The application automatically detects the actual sample rate being used and resamples the audio in real-time to 16kHz using linear interpolation. This happens transparently in the background:

1. **Detection**: When you start recording, the app detects your device's native sample rate
2. **Resampling**: If needed, audio is resampled from the native rate (e.g., 48kHz) down to 16kHz
3. **Processing**: The resampled 16kHz audio is sent to the Aiola API

**Technical Details:**
- **Algorithm**: Linear interpolation resampling
- **Performance**: Real-time processing in AudioWorklet (separate thread)
- **Quality**: Optimized for speech recognition accuracy
- **Transparency**: Works automatically without user intervention

You may see a message like "Audio resampling active (48000Hz → 16kHz)" when you start recording, indicating that resampling is being applied. Check the browser console for detailed logging.

### Supported Browsers

- ✅ Chrome/Edge (v80+)
- ✅ Firefox (v76+)
- ✅ Safari (v14.1+) - with automatic resampling
- ✅ Opera (v67+)

All browsers must support:
- Web Audio API with AudioWorklet
- MediaDevices API (getUserMedia)
- WebSocket connections

## Notes

- The `.env` file is gitignored to keep your credentials secure
- Make sure you have a valid Aiola API key and workflow ID
- Your browser must support the Web Audio API and MediaDevices API
- Audio is automatically resampled to 16kHz as required by the Aiola API
