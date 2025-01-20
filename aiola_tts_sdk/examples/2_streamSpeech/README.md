# aiOla TTS Streaming Test Client

**Version**: `0.1.0`

The **aiOla TTS Streaming Test Client** allows users to stream text-to-speech (TTS) in real-time. The audio starts playing before the entire text is processed, providing a seamless streaming experience.

## Features

- Real-time text-to-speech streaming.
- Select from a variety of predefined voices.
- Simple controls to start, stop, and monitor streaming progress.

## Requirements

- Modern browser with JavaScript support.
- Access to the aiOla TTS API endpoint.

## Installation

1. Download or clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2.	Ensure the aiola_tts_client.js SDK is included in your project.


## Code Highlights

### Initialization

The TTS client is initialized with the base API URL:

```javascript
import AiolaTTSClient from './aiola_tts_client.js';

const baseUrl = 'https://tesla.internal.aiola.ai/api/tts';
const ttsClient = new AiolaTTSClient(baseUrl);
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
```

### Customization

To change the list of voices, update the \<select\> element in index.html:

```html
<option value="af_bella">Bella</option>
<option value="af_nicole">Nicole</option>
```