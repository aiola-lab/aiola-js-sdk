# Speech-to-Text (STT) Examples

This directory contains examples demonstrating how to use the aiOla SDK for speech-to-text functionality.

## Quick start

<!--snippet;stt;quickstart-->
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