# Text-to-Speech (TTS) Examples

This example demonstrates how to use the aiOla SDK for text-to-speech.
Ensure that "type": "commonjs" is set in your package.json before running it.

## Quick start

<!--snippet;tts;quickstart-->
```ts
// Code example for Text-To-Speech (TTS) using Aiola SDK
// TypeScript version with proper type annotations for ES modules

import { createWriteStream, type WriteStream } from "fs";

// Dynamic import for Aiola SDK
const { AiolaClient } = await import("@aiola/sdk");

interface TtsOptions {
  text: string;
  voice: string;
  language: string;
}

async function ttsExample(): Promise<void> {
  const apiKey: string =
    process.env.AIOLA_API_KEY ||
    "<YOUR_API_KEY>";

  try {
    // Step 1: Generate access token
    const { accessToken } = await (AiolaClient as any).grantToken({
      apiKey: apiKey,
    });

    // Step 2: Create client
    const client = new (AiolaClient as any)({ accessToken });

    // Step 3.1: Make the TTS request
    await synthesizeToFile(client);

    // Step 3.2: Stream audio
    await streamTts(client);
  } catch (error) {
    console.error("Error:", (error as Error).message);
    if ((error as any).code) {
      console.error("Error code:", (error as any).code);
    }
  }

  async function synthesizeToFile(client: any): Promise<void> {
    const ttsOptions: TtsOptions = {
      text: "Hello, how can I help you today?",
      voice: "jess",
      language: "en",
    };

    const audio = await client.tts.synthesize(ttsOptions);

    // Step 4: Save audio stream to file name audio.wav
    const fileStream: WriteStream = createWriteStream("./audio.wav");

    audio.pipe(fileStream);

    console.log("Audio file created successfully");
  }

  async function streamTts(client: any): Promise<void> {
    const ttsOptions: TtsOptions = {
      text: "Hello, how can I help you today?",
      voice: "jess",
      language: "en",
    };

    const stream = await client.tts.stream(ttsOptions);

    const audioChunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      // Step 4: handle stream audio chunk
      console.log("chunk received", chunk);
      audioChunks.push(chunk);
    }

    console.log("Audio chunks received:", audioChunks.length);
  }
}

// Execute the example
ttsExample().catch((error: Error) => {
  console.error("Unhandled error:", error.message);
});

```
