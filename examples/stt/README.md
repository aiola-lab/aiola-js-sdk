# Speech-to-Text (STT) Examples

This directory contains examples demonstrating how to use the aiOla SDK for speech-to-text functionality.

## Quick start

<!--snippet;stt;quickstart-->
```typescript
// npm install @aiola/sdk
import { AiolaClient } from '@aiola/sdk';
import fs from 'fs';

async function transcribeAudio() {
  try {
    // Step 1: Set up authentication
    const { accessToken } = await AiolaClient.grantToken({
      apiKey: 'your-api-key-here'
    });
    
    // Step 2: Create client
    const client = new AiolaClient({ accessToken });

    // Step 3: Read audio file
    const audioFile = fs.readFileSync('path/to/your/audio.wav');
    
    // Step 4: Transcribe audio file
    const transcript = await client.stt.transcribeFile({
      file: audioFile,
      language: 'en',
      keywords: {
        "postgres": "PostgreSQL",
        "k eight s": "Kubernetes"
      }
    });
    
    console.log('Transcription:', transcript);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

transcribeAudio();

```