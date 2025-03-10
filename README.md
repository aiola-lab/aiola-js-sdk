# Aiola JavaScript SDK

This repository contains the official JavaScript/TypeScript SDKs for Aiola's services.

## Packages

### Speech-to-Text (STT)

```bash
npm install @aiola-js-sdk/stt
```

```typescript
import {
  AiolaStreamingClient,
  AiolaSocketNamespace,
  AiolaSocketConfig,
} from "@aiola-js-sdk/stt";

const client = new AiolaStreamingClient({
  baseUrl: "https://your-aiola-endpoint.com",
  namespace: AiolaSocketNamespace.EVENTS, // Available namespaces: EVENTS
  bearer: "your-auth-token",
  queryParams: {
    flow_id: "your-flow-id",
    execution_id: "your-execution-id",
    lang_code: "en_US",
    time_zone: "UTC",
  },
  // micConfig is optional - defaults to:
  // micConfig: {
  //   sampleRate: 16000,
  //   chunkSize: 4096,
  //   channels: 1
  // }
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

### Configuration Reference

#### AiolaSocketNamespace

```typescript
enum AiolaSocketNamespace {
  EVENTS = "/events",
}
```

#### AiolaSocketConfig

```typescript
interface AiolaSocketConfig {
  baseUrl: string; // The base URL of the Aiola API
  namespace: AiolaSocketNamespace; // The namespace to connect to
  bearer: string; // Authentication token
  queryParams: {
    // Query parameters for the connection
    flow_id: string; // The flow ID to use
    execution_id: string; // Execution ID for the session
    lang_code: string; // Language code (e.g., "en_US")
    time_zone: string; // Time zone (e.g., "UTC")
    [key: string]: string; // Additional custom parameters
  };
  micConfig?: {
    // Optional microphone configuration
    sampleRate: number; // Default: 16000
    chunkSize: number; // Default: 4096
    channels: number; // Default: 1
  };
  events: {
    // Event handlers
    onTranscript: (data: any) => void; // Called when transcript is received
    onEvents: (data: any) => void; // Called for other events
    onConnect?: () => void; // Called when connected
    onStartRecord?: () => void; // Called when recording starts
    onStopRecord?: () => void; // Called when recording stops
    onKeyWordSet?: (keywords: string[]) => void; // Called when keywords are set
    onError?: (error: AiolaSocketError) => void; // Called on errors
  };
  transports?: "polling" | "websocket" | "all"; // Transport method to use
}
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
});

// Synthesize speech and get audio buffer
const audioBuffer = await client.synthesizeSpeech("Hello, world!", "af_bella");

// Or stream the audio
const audioStream = await client.streamSpeech("Hello, world!", "af_nicole");

// Get available voices
const voices = client.getVoices();
// Returns:
// {
//   Default: "af",
//   Bella: "af_bella",
//   Nicole: "af_nicole",
//   Sarah: "af_sarah",
//   Sky: "af_sky",
//   Adam: "am_adam",
//   Michael: "am_michael",
//   Emma: "bf_emma",
//   Isabella: "bf_isabella",
//   George: "bm_george",
//   Lewis: "bm_lewis"
// }
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
