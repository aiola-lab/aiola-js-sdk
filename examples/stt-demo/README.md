# AIOLA Speech-to-Text Demo

This is a demonstration application showcasing the Aiola Speech-to-Text capabilities using the Aiola JavaScript SDK.

## Features

- Real-time speech-to-text transcription
- Keyword detection
- Simple and intuitive UI
- WebSocket-based communication
- Microphone input support

## Prerequisites

- Modern web browser with microphone support
- Internet connection
- Aiola API credentials

## Setup

1. Ensure you have the following files in your directory:

   - `index.html`
   - `script.js`
   - `styles.css`

2. Update the Aiola client configuration in `script.js` with your credentials:

   ```javascript
   const client = new AiolaStreamingClient({
     baseUrl: "YOUR_API_BASE_URL",
     bearer: "YOUR_API_KEY",
     queryParams: {
       flow_id: "YOUR_FLOW_ID",
       execution_id: "YOUR_EXECUTION_ID",
       lang_code: "en_US",
       time_zone: "UTC",
     },
   });
   ```

3. run ```npm run serve``` from the root and navigate to ```examples/stt-demo/```

## Usage

1. Open the application in your web browser.

2. Connect to the Aiola service:

   - Click the socket icon (plug) to establish a connection
   - The icon will turn blue when connected

3. Start recording:

   - Click the microphone icon to start recording
   - The icon will turn red when recording is active
   - Click again to stop recording

4. Set keywords (optional):

   - Enter comma-separated keywords in the input field
   - Click "Set Keywords" or press Enter to apply
   - The system will highlight when these keywords are detected in speech

5. View transcripts:
   - Speech transcriptions will appear in real-time in the transcript area
   - The transcript area scrolls automatically to show the latest content

## Error Handling

The application includes comprehensive error handling for:

- Network connectivity issues
- Microphone access problems
- Authentication errors
- Keyword setting issues
- Streaming errors

Error messages will be displayed in the message container at the top of the page.

## Dependencies

- Socket.IO (v4.7.4)
- Tabler Icons
- Aiola JavaScript SDK

## Browser Support

This demo works best in modern browsers that support:

- WebSocket API
- MediaRecorder API
- ES6 Modules
- Async/Await

## Troubleshooting

1. If the connection fails:

   - Check your API credentials
   - Ensure you have internet connectivity
   - Verify the API endpoint is accessible

2. If the microphone doesn't work:

   - Grant microphone permissions in your browser
   - Check if another application is using the microphone
   - Verify your microphone is properly connected and selected

3. If transcription isn't appearing:
   - Ensure you're connected (blue plug icon)
   - Check that recording is active (red microphone icon)
   - Verify your microphone is picking up audio (check system settings)

## Support

For additional support or to report issues, please contact the Aiola support team or refer to the official documentation.
