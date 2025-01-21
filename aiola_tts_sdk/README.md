# aiOla TTS Synthesize Vanilla JS SDK

**Version**: `0.1.0`

The **aiOla TTS Synthesize Test Client** provides a simple interface to convert text into speech using the aiOla Text-to-Speech (TTS) API and download the generated audio file.

## Features
- Real-time text-to-speech streaming.
- Convert text to speech and download the audio file as a `.wav`.
- Select from a variety of predefined voices.

---

## Requirements

- **Browser**:
  - Modern browsers (Chrome, Firefox, Edge).
  - Must support `AudioWorklet` and `Web Audio API`.
- **Server**:
  - Connection to Aiola backend with a valid API key.
- **HTTPS**:
  - Application must be served over `https://` or `localhost` to access the microphone.

---

## Installation

1. Download or clone the repository:
   ```bash
   git clone https://github.com/aiola-lab/aiola-js-sdk
   ```
2. Place `aiola_tts_client.js` in your project directory.

---

## Code Highlights

### Initialization

The TTS client is initialized with the base API URL:

```javascript
import AiolaTTSClient from './aiola_tts_client.js';

const baseUrl = 'https://tesla.internal.aiola.ai/api/tts';
const ttsClient = new AiolaTTSClient(baseUrl);
```

### Synthesis

The synthesize method is used to generate the audio:

```javascript
const audioBlob = await ttsClient.synthesize(text, voice);
```

### Generate Downloadable Link
The audio file is made downloadable using:

```javascript
const audioUrl = URL.createObjectURL(audioBlob);
const link = document.createElement('a');
link.href = audioUrl;
link.download = 'synthesized_audio.wav';
```

### Streaming

The synthesizeStream method is used for real-time streaming:

```javascript
const audioBlob = await ttsClient.synthesizeStream(text, voice);
```

### Playback
The streamed audio is played directly in the browser using:

```javascript
audioPlayer.src = URL.createObjectURL(audioBlob);
audioPlayer.play();
### Customization

To change the list of voices, update the \<select\> element in index.html:

```html
<option value="af_bella">Bella</option>
<option value="af_nicole">Nicole</option>
```