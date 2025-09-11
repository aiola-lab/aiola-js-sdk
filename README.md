# aiOla JavaScript SDK

The official JavaScript/TypeScript SDK for the [aiOla](https://aiola.com) API, work seamlessly in both Node.js and browser environments.

## Requirements

- **Node.js**: 18.0.0 or higher

## Documentation

Learn more about the aiOla API and how to use the SDK in our [documentation](https://docs.aiola.ai).

## Installation

```bash
npm install @aiola/sdk
# or
yarn add @aiola/sdk
```

## Usage

### Authentication

The aiOla SDK uses a **two-step authentication process**:

1. **Generate Access Token**: Use your API key to create a temporary access token, save it for later use
2. **Create Client**: Use the access token to instantiate the client, make sure to save

#### Step 1: Generate Access Token

```typescript
import { AiolaClient } from '@aiola/sdk';

const { accessToken, sessionId } = await AiolaClient.grantToken({
  apiKey: AIOLA_API_KEY
});
```

#### Step 2: Create Client

```typescript
const client = new AiolaClient({
  accessToken: accessToken
});
```

#### Error Handling

The SDK automatically handles common scenarios like concurrency limits:

```typescript
try {
  const { accessToken } = await AiolaClient.grantToken({ apiKey: AIOLA_API_KEY });
} catch (error) {
  if (error.code === 'MAX_CONCURRENCY_REACHED') {
    console.log('Concurrency limit reached. Please wait for existing sessions to expire.');
  }
}
```

#### Session Management

**Close Session on Server:**
```typescript
// Terminates the session on the server
await AiolaClient.closeSession(accessToken, {
  apiKey: AIOLA_API_KEY
});
```

#### Custom base URL (enterprises)

```typescript
const { accessToken } = await AiolaClient.grantToken({
  apiKey: AIOLA_API_KEY,
  authBaseUrl: 'https://mycompany.auth.aiola.ai',
});

const client = new AiolaClient({
  accessToken,
  baseUrl: 'https://mycompany.api.aiola.ai',
});
```

### Speech-to-Text – transcribe file

```typescript
import { AiolaClient } from '@aiola/sdk';
import fs from 'fs/promises';

async function transcribeFile() {
  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({ apiKey: AIOLA_API_KEY });
    
    // Step 2: Create client
    const client = new AiolaClient({ accessToken });
    
    // Step 3: Transcribe file
    const file = await fs.readFile('path/to/your/audio.wav');
    
    const transcript = await client.stt.transcribeFile({ 
      file: file,
      language: 'en', //supported lan: en,de,fr,es,pr,zh,ja,it
      keywords: {
        "<word_to_catch>": "<word_transcribe>",
      },
    });

    console.log(transcript);
  } catch (error) {
    console.error('Error transcribing file:', error);
  }
}

transcribeFile();
```

### Speech-to-Text – live streaming

```typescript
import { AiolaClient } from '@aiola/sdk';

const AIOLA_API_KEY = process.env.AIOLA_API_KEY || 'YOUR_API_KEY';

// Stream audio in real-time for live transcription
async function liveStreaming() {
  try {
    // Step 1: Generate access token, save it
    const { accessToken } = await AiolaClient.grantToken({ apiKey: AIOLA_API_KEY });
    
    // Step 2: Create client using the access token
    const client = new AiolaClient({ accessToken });
    
    // Step 3: Create stream connection
    const connection = await client.stt.stream({
      langCode: 'en', //supported lan: en,de,fr,es,pr,zh,ja,it
      keywords: {
        "venus": "venuss", // "<word_to_catch>": "<word_transcribe>",
      },
    });

    connection.on('transcript', (data) => {
      console.log('Transcript:', data.transcript);
    });

    connection.on('connect', async () => {
      console.log('Connected to streaming service');

      // Get an audio file (or use a microphone stream)
      const response = await fetch("https://github.com/aiola-lab/aiola-js-sdk/raw/refs/heads/main/examples/stt/assets/sample-en.wav");
      const audioData = await response.arrayBuffer();

      // Send audio data
      connection.send(Buffer.from(audioData));
    });

    connection.on('disconnect', () => {
      console.log('Disconnected from streaming service');
    });

    connection.on('error', (error) => {
      console.error('Streaming error:', error);
    });

    connection.connect();
    
  } catch (error) {
    console.error('Error setting up streaming:', error);
  }
}

liveStreaming();
```

### Text-to-Speech

```typescript
import fs from 'fs';
import { AiolaClient } from '@aiola/sdk';

async function createFile() {
  try {
    const { accessToken } = await AiolaClient.grantToken({ apiKey: AIOLA_API_KEY });
    
    const client = new AiolaClient({ accessToken });
    
    const audio = await client.tts.synthesize({
      text: 'Hello, how can I help you today?',
      voice: 'jess',
      language: 'en',
    });

    const fileStream = fs.createWriteStream('./output.wav');
    for await (const chunk of audio) {
        fileStream.write(chunk);
    }
    
    console.log('Audio file created successfully');
  } catch (error) {
    console.error('Error creating audio file:', error);
  }
}

createFile();
```

### Text-to-Speech – streaming

```typescript
import { AiolaClient } from '@aiola/sdk';

async function streamTts() {
  try {
    const { accessToken } = await AiolaClient.grantToken({ apiKey: AIOLA_API_KEY });
    
    const client = new AiolaClient({ accessToken });
    
    const stream = await client.tts.stream({
      text: 'Hello, how can I help you today?',
      voice: 'jess',
      language: 'en',
    });

    const audioChunks: Buffer[] = [];
    for await (const chunk of stream) {
      audioChunks.push(chunk);
    }
    
    console.log('Audio chunks received:', audioChunks.length);
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
