# Web File Transcription Example

A web application that demonstrates how to use the Aiola SDK's `transcribeFile` functionality in a browser environment.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Enter your Aiola API key when prompted
2. Select an audio file (WAV, MP3, M4A, etc.)
3. Choose the language of the audio
4. Optionally add keywords mapping in JSON format
5. Click "Transcribe Audio" to start transcription

## Features

- File upload for audio transcription
- Language selection
- Custom keywords mapping (JSON format)
- Real-time transcription results
- Error handling and loading states

## Keywords Format

Keywords should be in JSON format to map words to preferred transcriptions:

```json
{
  "venus": "venuss",
  "company": "CompanyName"
}
```