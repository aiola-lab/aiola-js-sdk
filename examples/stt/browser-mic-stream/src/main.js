import { AiolaClient } from "@aiola/sdk";

// DOM Elements
const connectToggle = document.getElementById("connectToggle");
const recordingToggle = document.getElementById("recordingToggle");
const messageContainer = document.getElementById("messageContainer");
const transcriptDiv = document.getElementById("transcript");

// Audio / connection state
let audioContext;
let microphoneStream;
let audioWorkletNode;
let connection;
let isRecording = false;

const client = new AiolaClient({
  apiKey: 'YOUR_API_KEY'
});


async function createStreamingConnection() {
  connection = await client.stt.stream({
    langCode: "en",
    keywords:{
      aiola: "aiOla"
    }
  });

  connection.on("connect", () => {
    console.log("Connection established");
    updateConnectionStatus(true);
    showMessage("Connection established");
  });

  connection.on("transcript", (data) => {
    console.log("Transcript:", data);
    const newTranscript = document.createElement("div");
    newTranscript.textContent = data.transcript;
    transcriptDiv.appendChild(newTranscript);
    transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
  });

  connection.on("disconnect", () => {
    console.log("Connection closed");
    updateConnectionStatus(false);
    showMessage("Connection closed");
    stopRecording();
  });

  connection.on("error", (error) => {
    console.error("Connection Error:", error);
    showMessage(`Error: ${error.message}`, true);
    updateConnectionStatus(false);
    stopRecording();
  });
}

async function setupMicrophone() {
  if (audioContext) return;

  audioContext = new AudioContext({ sampleRate: 16000 });
  await audioContext.audioWorklet.addModule("/audio-processor.js");

  microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
    },
  });

  const source = audioContext.createMediaStreamSource(microphoneStream);
  audioWorkletNode = new AudioWorkletNode(audioContext, "audio-processor");

  audioWorkletNode.port.onmessage = (event) => {
    if (connection && connection.connected && isRecording) {
      connection.send(event.data.audio_data);
    }
  };

  source.connect(audioWorkletNode);
}

async function startRecording() {
  if (!connection || !connection.connected) {
    showMessage("Please connect to the streaming service first", true);
    return;
  }

  try {
    await setupMicrophone();
    isRecording = true;
    updateRecordingStatus(true);
    showMessage("Recording started");
  } catch (err) {
    console.error("Error starting recording", err);
    showMessage(`Error starting recording: ${err.message}`, true);
  }
}

function stopRecording() {
  if (!isRecording) return;
  cleanupMicrophone();
  isRecording = false;
  updateRecordingStatus(false);
  showMessage("Recording stopped");
}

connectToggle.addEventListener("click", async () => {
  const isConnected = connectToggle.classList.contains("active");
  if (isConnected) {
    connection.disconnect();
  } else {
    showMessage("Connecting...");
    await createStreamingConnection();
    connection.connect();
  }
});

function showMessage(message, isError = false) {
  messageContainer.innerHTML = `<span class="${isError ? "error" : ""}">${message}</span>`;
}

function updateRecordingStatus(recording) {
  recordingToggle.classList.toggle("active", recording);
  const micIcon = recordingToggle.querySelector("i");
  if (micIcon) {
    micIcon.className = recording ? "ti ti-microphone" : "ti ti-microphone-off";
  }
}

function updateConnectionStatus(connected) {
  connectToggle.classList.toggle("active", connected);
  const connectIcon = connectToggle.querySelector("i");
  if (connectIcon) {
    connectIcon.className = connected
      ? "ti ti-plug-connected"
      : "ti ti-plug-connected-x";
  }
}

recordingToggle.addEventListener("click", async () => {
  if (recordingToggle.classList.contains("active")) {
    stopRecording();
  } else {
    await startRecording();
  }
});
 
function cleanupMicrophone() {
  if (microphoneStream) {
    microphoneStream.getTracks().forEach((track) => track.stop());
  }
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }
  audioContext = undefined;
  microphoneStream = undefined;
  audioWorkletNode = undefined;
}