import { AiolaClient } from "@aiola/sdk";

// DOM Elements
const form = document.getElementById('transcriptionForm');
const resultDiv = document.getElementById('result');
const transcribeBtn = document.getElementById('transcribeBtn');
const apiKeyInput = document.getElementById('apiKey');
const audioFileInput = document.getElementById('audioFile');
const languageSelect = document.getElementById('language');
const keywordsInput = document.getElementById('keywords');

// Client instance will be created after token generation
let client;

async function initializeClient(apiKey) {
  try {
    showResult('Generating access token...', 'loading');
    const { accessToken } = await AiolaClient.grantToken({
      apiKey: apiKey,
    });
    
    client = new AiolaClient({
      accessToken: accessToken
    });
    
    console.log('Client initialized successfully');
    return client;
  } catch (error) {
    showResult(`Failed to initialize client: ${error.message}`, 'error');
    throw error;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const apiKey = apiKeyInput.value;
  const audioFile = audioFileInput.files[0];
  const language = languageSelect.value;
  const keywordsInputValue = keywordsInput.value;
  
  let keywords = {};
  if (keywordsInputValue.trim()) {
    try {
      keywords = JSON.parse(keywordsInputValue);
    } catch (error) {
      showResult('Invalid keywords JSON format', 'error');
      return;
    }
  }
  
  if (!audioFile) {
    showResult('Please select an audio file', 'error');
    return;
  }
  
  transcribeBtn.disabled = true;
  showResult('Transcribing audio file...', 'loading');
  
  try {
    // Initialize client if not already done
    if (!client) {
      await initializeClient(apiKey);
    }
    
    // Use the File object directly - the SDK will handle it properly
    const transcript = await client.stt.transcribeFile({
      file: audioFile,
      language: language,
      keywords: Object.keys(keywords).length > 0 ? keywords : undefined,
    });

    showResult(`Transcription successful!\n\nResult: ${JSON.stringify(transcript, null, 2)}`, 'success');
    
  } catch (error) {
    console.error('Transcription error:', error);
    showResult(`Error: ${error.message}`, 'error');
    // Reset client on error to allow retry with different API key
    client = null;
  } finally {
    transcribeBtn.disabled = false;
  }
});

function showResult(message, type) {
  resultDiv.textContent = message;
  resultDiv.className = `result ${type}`;
  resultDiv.style.display = 'block';
}