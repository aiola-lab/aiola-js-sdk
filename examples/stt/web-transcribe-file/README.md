# Web File Transcription Example

A minimal web application that demonstrates how to use the Aiola SDK's `transcribeFile` functionality in a browser environment.

## Features

- File upload for audio transcription
- Language selection
- Custom keywords mapping
- Real-time transcription results
- Error handling and loading states

## Usage

1. Open `index.html` in a web browser
2. Enter your Aiola API key
3. Select an audio file (WAV, MP3, M4A, etc.)
4. Choose the language of the audio
5. Optionally add keywords mapping in JSON format
6. Click "Transcribe Audio" to start transcription

## Keywords Format

Keywords should be in JSON format to map words to preferred transcriptions:

```json
{
  "venus": "venuss",
  "company": "CompanyName"
}
```

## Requirements

- Modern web browser with JavaScript support
- Valid Aiola API key
- Internet connection for API calls

## Note

This example makes direct API calls to the Aiola service. In a production environment, you might want to:

- Use a backend proxy to handle API keys securely
- Implement proper CORS handling
- Add more robust error handling
- Include the SDK as a proper module import