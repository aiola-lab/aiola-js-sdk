# aiOla JavaScript SDK

The official JavaScript/TypeScript SDK for the [aiOla](https://aiola.com) API, work seamlessly in both Node.js and browser environments.

## Installation

```bash
npm install @aiola/sdk
# or
yarn add @aiola/sdk
```

## Usage

### Instantiate the client

```ts
import { AiolaClient } from '@aiola/sdk';

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});
```

#### Using Access Token

Create a client using an access token directly:

```ts
const client = new AiolaClient({
  accessToken: YOUR_ACCESS_TOKEN,
});
```

#### Create Access Token

Create a temporary access token from an API key:

```ts
const accessToken = await AiolaClient.grantToken(AIOLA_API_KEY);

const client = new AiolaClient({ accessToken });
```

This is useful for:
- **Backend-Frontend separation**: Generate temporary tokens in backend, use in frontend
- **Security**: Share access tokens instead of API keys
- **Token management**: Implement custom authentication flows

#### Custom base URL (enterprises)

Direct the SDK to use your own endpoint by providing the `baseUrl` option:

```ts
const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
  baseUrl: 'https://api.mycompany.aiola.ai',
});
```

### Speech-to-Text – transcribe file

```ts
async function transcribeFile() {
  try {
    const response = await fetch("https://github.com/aiola-lab/aiola-js-sdk/raw/refs/heads/main/examples/stt/assets/sample-en.wav");
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    const transcript = await client.stt.transcribeFile({ 
      file: audioBlob,
      language: "en"
    });

    console.log(transcript);
  } catch (error) {
    console.error('Error transcribing file:', error);
  }
}

transcribeFile();
```

### Speech-to-Text – live streaming

```ts
import { AiolaClient } from '@aiola/sdk';

const client = new AiolaClient({
  apiKey: 'YOUR_API_KEY',
});

// Stream audio in real-time for live transcription
async function liveStreaming() {
  const connection = await client.stt.stream({
    langCode: 'en',
  });

  connection.on('transcript', (data) => {
    console.log('Transcript:', data.transcript);
  });

  connection.on('connect', async () => {
    console.log('Connected to streaming service');
    
    const response = await fetch("https://github.com/aiola-lab/aiola-js-sdk/raw/refs/heads/main/examples/stt/assets/sample-en.wav");
    const audioData = await response.arrayBuffer();

    connection.send(Buffer.from(audioData));
  });

  connection.on('disconnect', () => {
    console.log('Disconnected from streaming service');
  });

  connection.on('error', (error) => {
    console.error('Streaming error:', error);
  });

  connection.connect();
}

liveStreaming();
```

### Text-to-Speech

```ts
import fs from 'node:fs';

async function createFile() {
  try {
    const audio = await client.tts.synthesize({
      text: 'Hello, how can I help you today?',
      voice: 'jess',
      language: 'en',
    });

    const fileStream = fs.createWriteStream('./audio.wav');
    audio.pipe(fileStream);
  } catch (error) {
    console.error('Error creating audio file:', error);
  }
}

createFile();
```

### Text-to-Speech – streaming

```ts
async function streamTts() {
  try {
    const stream = await client.tts.stream({
      text: 'Hello, how can I help you today?',
      voice: 'jess',
      language: 'en',
    });

    const audioChunks = [];
    for await (const chunk of stream) {
      audioChunks.push(chunk);
    }
  } catch (error) {
    console.error('Error streaming TTS:', error);
  }
}

streamTts();
```

## Browser example  

a ready-made web app that demonstrates how to use the SDK directly in a browser to stream microphone audio to aiOla Speech-to-Text and receive live transcripts.

```bash
cd examples/stt/browser-mic-stream
npm install
npm run dev
```
- Uses the [`AudioWorklet`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) API to capture microphone audio, convert it to 16-bit PCM (16 kHz, mono), and send it through the WebSocket returned.
