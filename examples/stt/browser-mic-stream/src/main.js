import { AiolaClient } from "@aiola/sdk";

// DOM Elements
const connectSwitch = document.getElementById("connectSwitch");
const recordingSwitch = document.getElementById("recordingSwitch");
const messageContainer = document.getElementById("messageContainer");
const transcriptDiv = document.getElementById("transcript");
const keywordsInput = document.getElementById("keywordsInput");
const keywordsButton = document.getElementById("keywordsButton");

// Audio / connection state
let audioContext;
let microphoneStream;
let audioWorkletNode;
let connection;
let isRecording = false;
let isConnected = false;
let isConnecting = false;
let currentKeywords = {};

const client = new AiolaClient({
  apiKey: 'ak_9bd254c9068ef50ce10fc3a359bda56676d99cd1901d151c0eefc0339c0f7efc'
});

// Initialize button states
function initializeButtons() {
  updateConnectionStatus(false);
  updateRecordingStatus(false);
  showMessage("Recording stopped");
}

async function createStreamingConnection() {
  connection = await client.stt.stream({
    langCode: "en",
    keywords: currentKeywords
  });

  connection.on("connect", () => {
    console.log("Connection established");
    isConnected = true;
    isConnecting = false;
    updateConnectionStatus(true);
    showMessage("Connected - Ready to record");
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
    isConnected = false;
    isConnecting = false;
    updateConnectionStatus(false);
    showMessage("Recording stopped");
    stopRecording();
  });

  connection.on("error", (error) => {
    console.error("Connection Error:", error);
    isConnected = false;
    isConnecting = false;
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
    showMessage("Recording... Speak now");
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

connectSwitch.addEventListener("click", async () => {
  // Prevent multiple clicks during connection process
  if (isConnecting) return;
  
  if (isConnected) {
    // Disconnect
    if (connection) {
      connection.disconnect();
    }
    showMessage("Disconnecting...");
  } else {
    // Connect
    isConnecting = true;
    showMessage("Connecting...");
    updateConnectionStatus(false, true); // Show connecting state
    
    try {
      await createStreamingConnection();
      connection.connect();
    } catch (error) {
      console.error("Failed to create connection:", error);
      isConnecting = false;
      showMessage(`Connection failed: ${error.message}`, true);
      updateConnectionStatus(false);
    }
  }
});

recordingSwitch.addEventListener("click", async () => {
  if (!isConnected) {
    showMessage("Please connect first", true);
    return;
  }

  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
});

// Enhanced keywords functionality using setKeywords method
keywordsButton.addEventListener("click", () => {
  const keywordsText = keywordsInput.value.trim();
  
  if (keywordsText) {
    const keywords = {};
    keywordsText.split(',').forEach(keyword => {
      const trimmed = keyword.trim();
      if (trimmed) {
        keywords[trimmed.toLowerCase()] = trimmed;
      }
    });
    
    const newKeywords = { ...keywords };
    currentKeywords = newKeywords;
    
    if (connection && connection.connected) {
      connection.setKeywords(newKeywords);
      showMessage(`Keywords updated: ${Object.keys(newKeywords).join(', ')}`);
    } else {
      showMessage(`Keywords set for next connection: ${Object.keys(newKeywords).join(', ')}`);
    }
  } else {
    const defaultKeywords = { };
    currentKeywords = defaultKeywords;
    
    if (connection && connection.connected) {
      connection.setKeywords(defaultKeywords);
      showMessage("Keywords cleared");
    } else {
      showMessage("Keywords cleared for next connection");
    }
  }
});

// Allow Enter key to set keywords
keywordsInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    keywordsButton.click();
  }
});

function showMessage(message, isError = false) {
  messageContainer.innerHTML = `<span class="${isError ? "error" : ""}">${message}</span>`;
}

function updateRecordingStatus(recording) {
  recordingSwitch.classList.toggle("active", recording);
  const micIcon = recordingSwitch.querySelector("i");
  if (micIcon) {
    micIcon.className = recording ? "ti ti-microphone" : "ti ti-microphone-off";
  }
  
  // Update switch title
  recordingSwitch.title = recording ? "Stop Recording" : "Start Recording";
}

function updateConnectionStatus(connected, connecting = false) {
  connectSwitch.classList.toggle("active", connected);
  const connectIcon = connectSwitch.querySelector("i");
  
  if (connectIcon) {
    if (connecting) {
      connectIcon.className = "ti ti-loader-2";
      connectIcon.style.animation = "spin 1s linear infinite";
    } else {
      connectIcon.className = connected
        ? "ti ti-plug-connected"
        : "ti ti-plug-connected-x";
      connectIcon.style.animation = "";
    }
  }
  
  // Update switch title
  connectSwitch.title = connected ? "Disconnect" : "Connect";
}

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

// Initialize the application
initializeButtons();