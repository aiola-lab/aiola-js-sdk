# Text-to-Speech (TTS) Examples

This example demonstrates how to use the aiOla SDK for text-to-speech.

## Quick start

<!--snippet;tts;quickstart-->
```typescript
// npm install @aiola/sdk
import { AiolaClient } from "@aiola/sdk";
import fs from "fs";

async function synthesize(): Promise<void> {
  try {
    // Step 1: Set up authentication
    const { accessToken } = await AiolaClient.grantToken({
      apiKey: 'your-api-key-here'
    });
    
    // Step 2: Create client
    const client = new AiolaClient({ accessToken });

    // Step 3: Synthesize text to audio
    const audio = await client.tts.synthesize({
      text: "Hello, how can I help you today?",
      voice_id: "en_us_female",
    });

    // Step 4: Save audio stream to file
    const fileStream = fs.createWriteStream('./output.wav');
    for await (const chunk of audio) {
        fileStream.write(chunk);
    }

    console.log("Audio file created successfully");

  } catch (error) {
    console.error("Error:", error);
  }
}

synthesize()
```
