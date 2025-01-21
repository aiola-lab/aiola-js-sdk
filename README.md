# aiOla JavaScript SDKs

Welcome to the **aiOla JavaScript SDKs** repository. This repository contains examples and documentation for various SDKs that integrate with aiOla's Text-to-Speech (TTS) and streaming services.

---

### aiOla Streaming SDK

### Features

- **Microphone Streaming**: Stream audio data from the browser's microphone.
- **Live Transcription**: Receive real-time transcription of the streamed audio.
- **Event Handling**: Process custom events received from the Aiola backend.
- **Customizable Configuration**: Easily configure microphone and server connection settings.
- **Keywords Spotting**: Set up keyword spotting for real-time detection of specific keywords.
- **Supported Languages: en-EN, de-DE, fr-FR, zh-ZH, es-ES, pt-PT**

- [read more](./aiola_streaming_sdk/README.md)


#### 1. Transcript and Events Example
- This example demonstrates how to use the aiOla Streaming SDK to capture live transcripts and handle backend-triggered events.
- **Key Features**:
  - Real-time transcription.
  - Event-driven callbacks.
  - [read more](./aiola_streaming_sdk/examples/1_transcript_events_example/README.md)

#### 2. Keyword Spotting Example
- This example shows how to set up keyword spotting using the aiOla Streaming SDK.
- **Key Features**:
  - Spot predefined keywords in live streams.
  - Event-driven keyword matching.
  - [read more](./aiola_streaming_sdk/examples/2_keywords_spotting_example/README.md)
---

### aiOla TTS SDK

### Features
- Real-time text-to-speech streaming.
- Convert text to speech and download the audio file as a `.wav`.
- Select from a variety of predefined voices.
- [read more](./aiola_tts_sdk/README.md)

#### 1. Synthesize Speech
- This example demonstrates how to convert text into speech and download the resulting audio file using the aiOla TTS SDK.
- **Key Features**:
  - Converts text into `.wav` audio files.
  - Supports voice selection.
  - [read more](./aiola_tts_sdk/examples/1_synthesizeSpeech/README.md)

#### 2. Stream Speech
- This example shows how to stream text-to-speech in real-time, enabling audio playback before the entire text is processed.
- **Key Features**:
  - Real-time TTS streaming.
  - Immediate audio playback.
  - [read more](./aiola_tts_sdk/examples/2_streamSpeech/README.md)
---

## Get Started

1. Clone the repository:
   ```bash
   git clone https://github.com/aiola-lab/aiola-js-sdk.git
   cd aiola-js-sdk
   ```
2.	Follow the instructions in the individual example directories for specific use cases.
