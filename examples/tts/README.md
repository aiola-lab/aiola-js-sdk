# Text-to-Speech (TTS) Examples

This example demonstrates how to use the aiOla SDK for text-to-speech.
Ensure that "type": "commonjs" is set in your package.json before running it.

## Quick start

<!--snippet;tts;quickstart-->
```ts
// Code example for Text-To-Speech (TTS) using Aiola SDK
// This example assumes usage in CommonJS environment

const { AiolaClient } = require("@aiola/sdk");
const fs = require("fs");

async function ttsExample() {
  const apiKey =
    process.env.AIOLA_API_KEY || "<YOUR-API-KEY>";

  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({
      apiKey: apiKey,
    });

    // Step 2: Create client
    const client = new AiolaClient({ accessToken });

    // Step 3.1: Make the TTS request
    await synthesizeToFile(client);
    
    // Step 3.2: Stream audio
    await streamTts(client);
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }

  async function synthesizeToFile(client) {
    const audio = await client.tts.synthesize({
      text: "Hello, how can I help you today?",
      voice: "jess",
      language: "en",
    });

    // Step 4: Save audio stream to file name audio.wav
    const fileStream = fs.createWriteStream("./audio.wav");
    audio.pipe(fileStream);

    console.log("Audio file created successfully");
  }

  async function streamTts(client) {
    const stream = await client.tts.stream({
      text: "Hello, how can I help you today?",
      voice: "jess",
      language: "en",
    });

    const audioChunks = [];
    for await (const chunk of stream) {
      // Step 4: handle stream audio chunk
      console.log("chunk received", chunk);
      audioChunks.push(chunk);
    }

    console.log("Audio chunks received:", audioChunks.length);
  }
}

ttsExample();
```
