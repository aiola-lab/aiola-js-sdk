# aiOla JavaScript SDK

The official JavaScript/TypeScript SDK for the [aiOla](https://aiola.com) API, designed to work seamlessly in both Node.js and browser environments.

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
import fs from 'node:fs';
import path from "path";

async function transcribeFile() {
  const filePath = path.resolve(__dirname, "./audio.wav");
  const file = fs.createReadStream(filePath);
  
  const transcript = await client.stt.transcribeFile({ 
    file: file,
    language: "en"
  });

  console.log(transcript);
}

transcribeFile();
```

### Speech-to-Text – live streaming

```ts
import { AiolaClient } from '@aiola/sdk';
import fs from 'node:fs';

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});

const connection = await client.stt.stream({
  lang_code: 'en',
});

connection.on('transcript', ({ transcript }) => {
  console.log('Transcript:', transcript);
});

const audio = fs.createReadStream('./audio.wav');
audio.on('data', (chunk) => connection.send(chunk));

connection.connect();
```

### Text-to-Speech

```ts
import fs from 'node:fs';

async function createFile() {
  const audio = await client.tts.synthesize({
    text: 'Hello, how can I help you today?',
    voice: 'jess',
    language: 'en',
  });

  const fileStream = fs.createWriteStream('./audio.wav');
  audio.pipe(fileStream);
}

createFile();
```

### Text-to-Speech – streaming

```ts
async function streamTts() {
  const stream = await client.tts.stream({
    text: 'Hello, how can I help you today?',
    voice: 'jess',
    language: 'en',
  });

  const audioChunks = [];
  for await (const chunk of stream) {
    audioChunks.push(chunk);
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
