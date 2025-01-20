# aiOla TTS Synthesize Test Client

**Version**: `0.1.0`

The **aiOla TTS Synthesize Test Client** provides a simple interface to convert text into speech using the aiOla Text-to-Speech (TTS) API and download the generated audio file.

## Features

- Convert text to speech and download the audio file as a `.wav`.
- Select from a variety of predefined voices.
- Simple and intuitive UI for testing the synthesis functionality.

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

### Customization

To change the list of voices, update the \<select\> element in index.html:

```html
<option value="af_bella">Bella</option>
<option value="af_nicole">Nicole</option>
```