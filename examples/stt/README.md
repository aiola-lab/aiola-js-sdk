# Speech-to-Text (STT) Examples

This directory contains examples demonstrating how to use the aiOla SDK for speech-to-text functionality.

## Quick start

<!--snippet;stt;quickstart-->
```ts
import { AiolaClient } from '@aiola/sdk';

const client = new AiolaClient({
  apiKey: 'YOUR_API_KEY',
});

// Transcribe an audio file to text
async function transcribeFile() {
  try {
    const response = await fetch("https://github.com/aiola-lab/aiola-js-sdk/raw/refs/heads/main/examples/stt/assets/sample-en.wav");
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    const transcript = await client.stt.transcribeFile({ 
      file: audioBlob,
      language: "en"
    });

    console.log(transcript);
  } catch (error) {
    console.error('Error transcribing file:', error);
  }
}

// Stream audio in real-time for live transcription
async function liveStreaming() {
  const connection = await client.stt.stream({
    langCode: 'en',
  });

  connection.on('transcript', (data) => {
    console.log('Transcript:', data.transcript);
  });

  connection.on('connect', async () => {
    console.log('Connected to streaming service');
    
    const response = await fetch("https://github.com/aiola-lab/aiola-js-sdk/raw/refs/heads/main/examples/stt/assets/sample-en.wav");
    const audioData = await response.arrayBuffer();

    connection.send(Buffer.from(audioData));
  });

  connection.on('disconnect', () => {
    console.log('Disconnected from streaming service');
  });

  connection.on('error', (error) => {
    console.error('Streaming error:', error);
  });

  connection.connect();
}

transcribeFile();
liveStreaming();
```