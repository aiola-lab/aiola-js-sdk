# Aiola JavaScript SDK

This repository contains the official JavaScript/TypeScript SDKs for Aiola's services.

## Packages

### Speech-to-Text (STT)

```bash
npm install @aiola-js-sdk/stt
```

```typescript
import AiolaStreamingClient from "@aiola-js-sdk/stt";

const client = new AiolaStreamingClient({
  baseUrl: "https://your-aiola-endpoint.com",
  namespace: "/your-namespace",
  bearer: "your-auth-token",
  queryParams: {},
  micConfig: {
    sampleRate: 16000,
    chunkSize: 4096,
    channels: 1,
  },
  events: {
    onTranscript: (data) => {
      console.log("Transcript:", data);
    },
    onEvents: (data) => {
      console.log("Event:", data);
    },
  },
});

await client.startStreaming();
```

### Text-to-Speech (TTS)

```bash
npm install @aiola-js-sdk/tts
```

```typescript
import AiolaTTSClient from "@aiola-js-sdk/tts";

const client = new AiolaTTSClient({
  baseUrl: "https://your-aiola-endpoint.com",
  bearer: "your-auth-token",
  defaultVoice: "en-US-1",
});

// Synthesize speech and get audio buffer
const audioBuffer = await client.synthesizeSpeech("Hello, world!");

// Or stream the audio
const audioStream = await client.streamSpeech("Hello, world!");
```

## Development

### Setup

```bash
npm install
```

### Build all packages

```bash
npm run build
```

### Type checking

```bash
npm run type-check
```

## License

ISC
