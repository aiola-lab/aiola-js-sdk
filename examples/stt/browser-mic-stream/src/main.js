import { AiolaClient } from "@aiola/sdk"

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
let micDataSent = false;

// Client instance will be created after token generation
let client;

// Initialize button states
function initializeButtons() {
  updateConnectionStatus(false);
  updateRecordingStatus(false);
  showMessage("Recording stopped");
  
  // Set placeholder to guide user about keywords
  keywordsInput.placeholder = "Enter keywords (comma separated)";
}

async function initializeClient() {
  if (client) return client;
  
  // Read required environment variables
  const apiKey = import.meta.env.VITE_AIOLA_API_KEY;
  const workflowId = import.meta.env.VITE_AIOLA_WORKFLOW_ID;

  // Read optional environment variables
  const authBaseUrl = import.meta.env.VITE_AIOLA_AUTH_BASE_URL;
  const baseUrl = import.meta.env.VITE_AIOLA_BASE_URL;

  // Validate required environment variables
  if (!apiKey || !workflowId) {
    throw new Error("AIOLA_API_KEY and AIOLA_WORKFLOW_ID must be set in the environment variables");
  }
  
  try {
    showMessage("Generating access token...");
    const { accessToken } = await AiolaClient.grantToken({
      apiKey,
      workflowId,
      ...(authBaseUrl ? { authBaseUrl } : {}),
    });
    
    client = new AiolaClient({
      accessToken,
      ...(baseUrl ? { baseUrl } : {}),
    });
    
    showMessage("Client initialized successfully");
    return client;
  } catch (error) {
    showMessage(`Failed to initialize client: ${error.message}`, true);
    throw error;
  }
}

async function createStreamingConnection() {
  if (!client) {
    await initializeClient();
  }
  
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

  connection.on("disconnect", (reason) => {
    console.log("Connection closed, reason:", reason);
    isConnected = false;
    isConnecting = false;
    updateConnectionStatus(false);
    showMessage("Recording stopped");
    stopRecording();
  });

  connection.on("error", (error) => {
    console.error("Connection Error:", error);
    isConnecting = false;
    isConnected = false;
    updateConnectionStatus(false);
    showMessage(`Error: ${error.message}`, true);
  });

  connection.on("connect_error", (error) => {
    console.error("Connection Error (connect_error):", error);
    isConnecting = false;
    isConnected = false;
    updateConnectionStatus(false);
    showMessage(`Connection failed: ${error.message}`, true);
  });
}

async function setupMicrophone() {
  if (audioContext) return;

  // Request a sample rate of 16KHz, as this is the required sample rate for the API.
  // In case the browser does not support this, the audio-processor.js will handle resampling to 16kHz.
  audioContext = new AudioContext({ sampleRate: 16000 });
  
  console.log(`[Setup] AudioContext sample rate: ${audioContext.sampleRate}Hz`);
  console.log(`[Setup] Target sample rate for API: 16000Hz`);
  
  if (audioContext.sampleRate !== 16000) {
    console.log(`[Setup] Resampling will be applied: ${audioContext.sampleRate}Hz → 16000Hz`);
    showMessage(`Audio resampling active (${audioContext.sampleRate}Hz → 16kHz)`);
  }
  
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
      
      // Disable keywords button after first mic data is sent
      if (!micDataSent) {
        micDataSent = true;
        keywordsButton.disabled = true;
        keywordsInput.disabled = true;
      }
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
    // Send keywords before starting microphone to ensure they are set before any audio data
    if (Object.keys(currentKeywords).length > 0) {
      connection.setKeywords(currentKeywords);
    }
    
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
  micDataSent = false;
  updateRecordingStatus(false);
  showMessage("Recording stopped");
  
  // Re-enable keywords controls when recording stops
  keywordsButton.disabled = false;
  keywordsInput.disabled = false;
}

connectSwitch.addEventListener("click", async () => {
  // Prevent multiple clicks during connection process
  if (isConnecting) return;
  
  if (isConnected) {
    // Disconnect
    if (connection) {
      connection.disconnect();
    }
    showMessage("Disconnected");
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

// Keywords functionality using setKeywords method
keywordsButton.addEventListener("click", () => {
  const keywordsText = keywordsInput.value.trim();
  
  if (keywordsText) {
    const keywords = {};
    keywordsText.split(',').forEach(keyword => {
      const trimmed = keyword.trim();
      if (trimmed) {
        keywords[trimmed] = trimmed;
      }
    });
    
    const newKeywords = { ...keywords };
    currentKeywords = newKeywords;
    
    if (connection && connection.connected) {
      connection.setKeywords(newKeywords);
      showMessage(`Keywords updated: ${Object.keys(newKeywords).join(', ')}`);
    } else {
      showMessage(`Keywords: ${Object.keys(newKeywords).join(', ')}`);
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