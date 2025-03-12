# Aiola TTS Demo

This is a demonstration of the Aiola Text-to-Speech (TTS) SDK capabilities. The demo provides a simple web interface where you can convert text to speech using different voices, with options for both regular synthesis and streaming.

## Features

- Text-to-speech conversion
- Multiple voice options
- Two synthesis modes:
  - Regular synthesis (full audio file)
  - Streaming synthesis (real-time streaming)
- Audio playback controls

## Prerequisites

- Node.js and npm installed
- Access to Aiola API (API key required)

## Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies:

```bash
npm install
```

3. Configure the API credentials:
   Update the `baseUrl` and `bearer` token in `main.js` with your Aiola API credentials:

```javascript
const client = new AiolaTTSClient({
  baseUrl: "YOUR_API_BASE_URL",
  bearer: "YOUR_API_KEY",
});
```

## Usage

1. run ```npm run serve``` from the root and navigate to ```examples/tts-demo/```
2. Open the demo in your web browser
3. Enter the text you want to convert to speech
4. Select a voice from the dropdown menu
5. Choose either:
   - "Synthesize" for full audio file generation
   - "Stream" for real-time streaming synthesis
6. Listen to the generated audio using the audio player controls

## Implementation Details

The demo uses the Aiola TTS SDK (`AiolaTTSClient`) to handle text-to-speech conversion. It provides two main methods:

- `synthesizeSpeech`: Generates a complete audio file
- `streamSpeech`: Provides real-time streaming of the audio

The audio is played using the HTML5 audio player, supporting standard audio controls.

## Error Handling

The application includes basic error handling for both synthesis methods:

- Failed synthesis attempts are logged to the console
- User-friendly error messages are displayed via alerts
- Buttons are disabled during processing to prevent multiple simultaneous requests

## License

[Add your license information here]

## Support

For any issues or questions regarding the Aiola TTS SDK, please contact [support contact information].
