# Text-to-Speech (TTS) Examples

This directory contains examples demonstrating how to use the aiOla SDK for text-to-speech functionality.

## Quick start

<!--snippet;tts;quickstart-->
```ts
import { AiolaClient } from '@aiola/sdk';
import fs from 'node:fs';

const client = new AiolaClient({
  apiKey: process.env.AIOLA_API_KEY,
});

async function synthesizeToFile() {
  const audioStream = await client.tts.synthesize({
    text: "Hello, how can I help you today?",
    voice: "jess",
    language: "en",
  });

  // Save to file
  const fileStream = fs.createWriteStream("./output.wav");
  audioStream.pipe(fileStream);

  fileStream.on('finish', () => {
    console.log("Audio file saved successfully!");
  });

  fileStream.on('error', (error) => {
    console.error("Error saving file:", error);
  });
}

async function streamTts() {
  const stream = await client.tts.stream({
    text: "Hello, this is a streaming example of text-to-speech synthesis.",
    voice: "jess",
    language: "en",
  });
  
  // Collect audio chunks
  const audioChunks = [];
  for await (const chunk of stream) {
    audioChunks.push(chunk);
  }
  
  // Process chunks as needed (e.g., play audio, save to buffer, etc.)
}
```
