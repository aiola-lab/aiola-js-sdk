# Speech-to-Text (STT) Examples

This directory contains examples demonstrating how to use the aiOla SDK for speech-to-text functionality.

## Quick start

<!--snippet;stt;quickstart-->
```ts
import { AiolaClient } from '@aiola/sdk';
import fs from 'node:fs';
import path from "path";

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});

const filePath = path.resolve(__dirname, "./audio.wav");

// Transcribe an audio file to text
async function transcribeFile() {
  const audioFile = fs.createReadStream(filePath);
  
  const transcript = await client.stt.transcribeFile({ 
    file: audioFile,
    language: "en"
  });

  console.log(transcript);
}

// Stream audio in real-time for live transcription
async function liveStreaming() {
  const connection = await client.stt.stream({
    langCode: 'en',
  });

  connection.on('transcript', (data) => {
    console.log('Transcript:', data.transcript);
  });

  connection.on('connect', () => {
    console.log('Connected to streaming service');
  });

  connection.on('disconnect', () => {
    console.log('Disconnected from streaming service');
  });

  connection.on('error', (error) => {
    console.error('Streaming error:', error);
  });

  connection.connect();

  const audioFile = fs.createReadStream(filePath);

  audioFile.on('data', (chunk) => {
    connection.send(chunk);
  });

  audioFile.on('end', () => {
    connection.disconnect();
  });

  audioFile.on('error', (error) => {
    console.error('File read error:', error);
  });
}
```