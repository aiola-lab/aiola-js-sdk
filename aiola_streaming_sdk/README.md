# Aiola Streaming Vanilla JS SDK

**Version**: `0.1.0`

The **Aiola Streaming Vanilla JS SDK** allows developers to easily integrate microphone audio streaming with Aiola's services. The SDK supports live transcription and event-based interactions in the browser using vanilla JavaScript.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Include the SDK](#include-the-sdk)
  - [AiolaStreamingClient API](#aiolastreamingclient-api)
    - [Initialization](#initialization)
    - [Streaming](#streaming)
  - [Example Code](#example-code)
- [Configuration](#configuration)
  - [Microphone Configuration](#microphone-configuration)
  - [Events](#events)
- [Example Callbacks](#example-callbacks)

---

## Features

- **Microphone Streaming**: Stream audio data from the browser's microphone.
- **Live Transcription**: Receive real-time transcription of the streamed audio.
- **Event Handling**: Process custom events received from the Aiola backend.
- **Customizable Configuration**: Easily configure microphone and server connection settings.

---

## Requirements

- **Browser**:
  - Modern browsers (Chrome, Firefox, Edge).
  - Must support `AudioWorklet` and `Web Audio API`.
- **Server**:
  - Connection to Aiola backend with a valid API key.
- **HTTPS**:
  - Application must be served over `https://` or `localhost` to access the microphone.

---

## Installation

1. Download or clone the SDK file:
   ```bash
   git clone https://github.com/aiola-lab/aiola-js-sdk
   ```
2. Place `aiola_streaming_client.js` in your project directory.

---

# Usage

## Include the SDK

Add the following to your HTML file:

```html
<script type="module">
  import AiolaStreamingClient from "./aiola_streaming_client.js";
</script>
```

## AiolaStreamingClient API

#### initialization:

```javascript
const config = {...} 
const streamingClient = new AiolaStreamingClient(config);
```
for more details on the config, see [Config](#configuration)
#### streaming:

```javascript
streamingClient.startStreaming();
streamingClient.stopStreaming();
```

#### keywords spotting
```javascript
streamingClient.set_kws(['comma', 'separated', 'keywords']);
```




---

## Configuration

The SDK accepts the following configuration options:

| Property      | Type   | Default     | Description                                          |
| ------------- | ------ | ----------- | ---------------------------------------------------- |
| `baseUrl`     | string | Required    | The base URL of the Aiola backend.                   |
| `namespace`   | string | /events     | Namespace for subscription (/events or /transcript). |
| `queryParams` | object | Required    | Query parameters for the connection (e.g., flow_id). |
| `bearer`      | string | Required    | Bearer token for authentication.                     |
| `transports`  | array  | ['polling'] | Transport methods ('polling' or 'websocket').        |
| `micConfig`   | object | See below   | Microphone configuration (sample rate, chunk size).  |
| `events`      | object | Required    | Callback functions for handling events.              |

### Microphone Configuration

| Property     | Type   | Default | Description                      |
| ------------ | ------ | ------- | -------------------------------- |
| `sampleRate` | number | 16000   | Sample rate in Hz.               |
| `channels`   | number | 1       | Number of audio channels (Mono). |
| `chunkSize`  | number | 4096    | Size of each audio chunk.        |
| `dtype`      | string | int16   | Data type for audio samples.     |

### Events

| Event Name     | Description                                  |
| -------------- | -------------------------------------------- |
| `onTranscript` | Callback for transcript data.                |
| `onEvents`     | Callback for custom events from the backend. |

#### Example Callbacks

```javascript
function handleTranscript(data) {
  const transcript = data?.transcript || "No transcript";
  console.log(`Transcript received: ${transcript}`);
}

function handleEvents(data) {
  const events = data?.results?.Items || [];
  console.log(`Events received:`, events);
}
```


# Example Code

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aiola Streaming</title>
  </head>
  <body>
    <h1>Aiola Streaming Client</h1>
    <h2>Workflow ID: <span id="workflow-id">Loading...</span></h2>
    <button id="start">Start Streaming</button>
    <button id="stop">Stop Streaming</button>

    <div class="scrollable-table">
      <table id="log-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <script type="module">
      import AiolaStreamingClient from "./aiola_streaming_client.js";

      const bearer = "bearer"; // Replace with your actual bearer
      const config = {
        baseUrl: `<baseUrl>`, // The URL of the Aiola server
        namespace: "/events", // Namespace for subscription: /transcript (for transcription) or /events (for transcription + LLM solution)
        queryParams: {
          flow_id: `<flow_id_here>`, // One of the IDs from the flows created for the user
          execution_id: "1", // Unique identifier to trace execution
          lang_code: "en_US", // Language code for transcription
          time_zone: "UTC", // Time zone for timestamp alignment
        },
        bearer: `<your_bearer_here>`, // Bearer, obtained upon registration with Aiola
        transports: "polling", // Communication method: 'websocket' for L4 or 'polling' for L7
        micConfig: {
          sampleRate: 16000, // Sample rate in Hz
          channels: 1, // Number of audio channels (Mono = 1)
          chunkSize: 4096, // Size of each audio chunk in bytes
          dtype: "int16", // Data type for audio samples
        },
        events: {
          onTranscript: handleTranscript, // Callback for transcript data
          onEvents: handleEvents, // Callback for event-related data
        },
      };

      // Initialize the streaming client
      const streamingClient = new AiolaStreamingClient(config);

      function handleTranscript(data) {
        const transcript = data?.transcript || "No transcript";
        console.log(`Transcript received: ${transcript}`);
      }

      function handleEvents(data) {
        const events = data?.results?.Items || [];
        console.log(`Events received:`, events);
      }

      // Start and stop streaming
      document
        .getElementById("start")
        .addEventListener("click", () => streamingClient.startStreaming());
      document
        .getElementById("stop")
        .addEventListener("click", () => streamingClient.stopStreaming());
    </script>
  </body>
</html>
```
