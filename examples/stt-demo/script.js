import {
  AiolaStreamingClient,
  AiolaSocketError,
  AiolaSocketErrorCode,
  AiolaSocketNamespace,
} from "/libs/stt/dist/bundle/index.js";

const baseUrl = "https://api-testing.internal.aiola.ai";
const bearer = "fa6a7a103c2b008301088471e7aab343";
const flowId = "848f4a40-5c3d-481b-a2c6-da0b3d99e7e0";
const executionId = "3344";
const langCode = "en_US";
const timeZone = "Asia/Jerusalem";

const messageContainer = document.getElementById("messageContainer");
const socketToggle = document.getElementById("socketToggle");
const recordingToggle = document.getElementById("recordingToggle");
const keywordsInput = document.getElementById("keywordsInput");
const setKeywordsButton = document.getElementById("setKeywordsButton");

function showMessage(message, isError = false) {
  messageContainer.innerHTML = `<span class="${
    isError ? "error" : ""
  }">${message}</span>`;
}

function handleError(error, context = "") {
  console.error(`Error in ${context}:`, error);
  let errorMessage = error.message || "An unexpected error occurred";

  if (error instanceof AiolaSocketError) {
    switch (error.code) {
      case AiolaSocketErrorCode.NETWORK_ERROR:
        errorMessage = `Network connection error. ${error.message}`;
        break;
      case AiolaSocketErrorCode.AUTHENTICATION_ERROR:
        errorMessage = `Authentication error. ${error.message}`;
        break;
      case AiolaSocketErrorCode.MIC_ERROR:
        errorMessage = `Microphone error. ${error.message}`;
        break;
      case AiolaSocketErrorCode.KEYWORDS_ERROR:
        errorMessage = `Error setting keywords. ${error.message}`;
        break;
      case AiolaSocketErrorCode.STREAMING_ERROR:
        errorMessage = `Streaming error. ${error.message}`;
        break;
      default:
        errorMessage = error.message;
    }

    showMessage(errorMessage, true);

    // Attempt recovery based on error type
    switch (error.code) {
      case AiolaSocketErrorCode.NETWORK_ERROR:
        // Attempt to reconnect after a delay
        setTimeout(async () => {
          if (!socketToggle.classList.contains("active")) {
            showMessage("Attempting to reconnect...");
            try {
              await client.connect();
            } catch (reconnectError) {
              handleError(reconnectError, "reconnection");
            }
          }
        }, 5000);
        break;
      case AiolaSocketErrorCode.MIC_ERROR:
        // Reset recording state
        recordingToggle.classList.remove("active");
        const micIcon = recordingToggle.querySelector("i");
        if (micIcon) {
          micIcon.className = "ti ti-microphone-off";
        }
        break;
    }
  } else {
    showMessage(errorMessage, true);
  }
}

function updateSocketStatus(connected) {
  socketToggle.classList.toggle("active", connected);
  recordingToggle.classList.toggle("active", false);
  const socketIcon = socketToggle.querySelector("i");
  if (socketIcon) {
    socketIcon.className = connected
      ? "ti ti-plug-connected"
      : "ti ti-plug-connected-x";
  }
  const micIcon = recordingToggle.querySelector("i");
  if (micIcon) {
    micIcon.className = "ti ti-microphone-off";
  }
  showMessage(
    connected ? "Socket connected successfully" : "Socket disconnected"
  );
}

const client = new AiolaStreamingClient({
  baseUrl: baseUrl,
  bearer: bearer,
  namespace: AiolaSocketNamespace.EVENTS,
  transports: "websocket",
  queryParams: {
    flow_id: flowId,
    execution_id: executionId,
    lang_code: langCode,
    time_zone: timeZone,
  },
  events: {
    onTranscript: (data) => {
      console.log("Transcript:", data.transcript);
      const transcriptDiv = document.getElementById("transcript");
      const newTranscript = document.createElement("div");
      newTranscript.textContent = data.transcript;
      transcriptDiv.appendChild(newTranscript);
      transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
    },
    onEvents: (data) => {
      console.log("Event:", data);
    },
    onConnect: () => {
      updateSocketStatus(true);
      showMessage("Connected successfully");
    },
    onError: (error) => {
      handleError(error, "connection");
      updateSocketStatus(false);
    },
    onStartRecord: () => {
      showMessage("Recording started");
      recordingToggle.classList.add("active");
      const micIcon = recordingToggle.querySelector("i");
      if (micIcon) {
        micIcon.className = "ti ti-microphone";
      }
    },
    onStopRecord: () => {
      showMessage("Recording stopped");
      recordingToggle.classList.remove("active");
      const micIcon = recordingToggle.querySelector("i");
      if (micIcon) {
        micIcon.className = "ti ti-microphone-off";
      }
    },
    onKeyWordSet: (keywords) => {
      showMessage(`Keywords set successfully: ${keywords.join(", ")}`);
    },
    onKeyWordsError: (error) => {
      handleError(error, "keywords");
    },
  },
});

socketToggle.addEventListener("click", async () => {
  console.log("socketToggle clicked");
  const isConnected = socketToggle.classList.contains("active");
  try {
    if (isConnected) {
      client.closeSocket();
      const isRecording = recordingToggle.classList.contains("active");
      if (isRecording) {
        client.stopRecording();
      }
      updateSocketStatus(false);
    } else {
      showMessage("Connecting...");
      client.connect(true);
    }
  } catch (error) {
    handleError(error, "socket toggle");
  }
});

recordingToggle.addEventListener("click", async () => {
  const isRecording = recordingToggle.classList.contains("active");
  try {
    if (isRecording) {
      client.stopRecording();
      recordingToggle.classList.remove("active");
      const micIcon = recordingToggle.querySelector("i");
      if (micIcon) {
        micIcon.className = "ti ti-microphone-off";
      }
    } else {
      showMessage("Starting recording...");
      await client.startRecording();
      const micIcon = recordingToggle.querySelector("i");
      if (micIcon) {
        micIcon.className = "ti ti-microphone";
      }
    }
  } catch (error) {
    handleError(error, "recording toggle");
  }
});

setKeywordsButton.addEventListener("click", () => {
  const keywords = keywordsInput.value
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  try {
    client.setKeywords(keywords);
    showMessage(`Keywords set: ${keywords.join(", ")}`);
  } catch (error) {
    handleError(error, "keywords");
  }
});

// Add keyboard support for setting keywords
keywordsInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    setKeywordsButton.click();
  }
});
