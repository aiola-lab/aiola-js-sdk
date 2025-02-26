# Aiola SDK Examples

This directory contains example applications demonstrating the usage of Aiola SDKs.

## STT Demo

A simple web application demonstrating real-time speech-to-text capabilities using the `@aiola-js-sdk/stt` package.

### Setup

1. Navigate to the `stt-demo` directory
2. Open `index.html` in a text editor
3. Replace the following placeholders with your Aiola credentials:
   - `YOUR_AIOLA_ENDPOINT`
   - `YOUR_NAMESPACE`
   - `YOUR_AUTH_TOKEN`
4. Serve the directory using a local web server (e.g., `python -m http.server` or `npx serve`)
5. Open the application in your browser

### Features

- Real-time speech-to-text transcription
- Simple start/stop controls
- Live transcript display

## TTS Demo

A web application showcasing text-to-speech capabilities using the `@aiola-js-sdk/tts` package.

### Setup

1. Navigate to the `tts-demo` directory
2. Open `index.html` in a text editor
3. Replace the following placeholders with your Aiola credentials:
   - `YOUR_AIOLA_ENDPOINT`
   - `YOUR_AUTH_TOKEN`
4. Serve the directory using a local web server
5. Open the application in your browser

### Features

- Text input for speech synthesis
- Voice selection
- Two modes of operation:
  - Full synthesis (synthesize entire text at once)
  - Streaming synthesis (start playback before full processing)
- Audio playback controls

## Running the Examples

The examples are simple HTML applications that can be served using any web server. Here are a few options:

Using Python:

```bash
cd examples/stt-demo  # or tts-demo
python -m http.server 8080
```

Using Node.js:

```bash
cd examples/stt-demo  # or tts-demo
npx serve
```

Then open your browser and navigate to the local server address (typically `http://localhost:8080` or similar).
