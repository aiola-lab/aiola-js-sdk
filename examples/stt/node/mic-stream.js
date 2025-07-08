const { AiolaClient } = require("../../../dist/main/index.js");
const { SoxRecording } = require("./sox.js");

const AIOLA_API_KEY = process.env.AIOLA_API_KEY || 'YOUR_API_KEY';

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});

async function startStreaming() {
  const connection = await client.stt.stream({
    langCode: "en",
    keywords: {
      aiola: "aiOla",
    },
  });

  connection.on('connect', () => {
    console.log("Connected to Streaming service");
  });

  connection.on('transcript', (data) => {
    console.log("Transcript:", data.transcript);
  });

  connection.on('disconnect', () => {
    console.log("Disconnected from Streaming service");
  });

  connection.connect();

  const recording = new SoxRecording({
    sampleRate: 16000,
    channels: 1,
    audioType: "wav",
  });

  const microphoneStream = recording.stream();

  microphoneStream.on('data', (chunk) => {
    connection.send(chunk);
  });

  microphoneStream.on('error', (err) => {
    console.error('Recording error:', err);
  });
}

startStreaming();