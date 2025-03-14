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

Current SDK Version: 0.1.0

```bash
npm install @aiola-js-sdk/tts
```

```typescript
import AiolaTTSClient from "@aiola-js-sdk/tts";

// First create the client
const client = new AiolaTTSClient({
  baseUrl: "https://your-aiola-endpoint.com",
  bearer: "your-auth-token",
});

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

// Create a client with default voice using getVoices()
const clientWithDefault = new AiolaTTSClient({
  baseUrl: "https://your-aiola-endpoint.com",
  bearer: "your-auth-token",
  defaultVoice: voices.Default, // Using the Default voice from getVoices()
});

// Synthesize speech and get audio as a Blob
// Voice can be provided in the method call or will use defaultVoice from config
const audioBlob = await clientWithDefault.synthesizeSpeech(
  "Hello, world!",
  voices.Bella
);

// Using defaultVoice from config
const audioBlob2 = await clientWithDefault.synthesizeSpeech("Hello, world!");

// If neither voice parameter nor defaultVoice is provided, an error will be thrown
const clientWithoutDefault = new AiolaTTSClient({
  baseUrl: "https://your-aiola-endpoint.com",
  bearer: "your-auth-token",
});
// This will throw: "Voice is required for synthesis"
await clientWithoutDefault.synthesizeSpeech("Hello, world!");

// Stream the audio (also returns a Blob)
const streamBlob = await clientWithDefault.streamSpeech(
  "Hello, world!",
  voices.Nicole
);
```

#### TTSConfig Interface

```typescript
interface TTSConfig {
  baseUrl: string; // The base URL of the Aiola API
  bearer: string; // Authentication token
  defaultVoice?: string; // Optional default voice. If not provided, voice must be specified in method calls
}
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

### Run example apps


From the root 

```bash 
npm run serve
```  

And navigate to ```examples``` and navigate to wanted example

### Type checking

```bash
npm run type-check
```

## License

ISC

```

```
