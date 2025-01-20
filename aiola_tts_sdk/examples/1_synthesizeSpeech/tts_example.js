async function synthesizeSpeech(text, voiceFile = null, voiceText = null) {
    const formData = new FormData();
    formData.append('text', text);
  
    if (voiceFile) {
      formData.append('voice', voiceFile);
      formData.append('voice_text', voiceText);
    }
  
    const response = await fetch('https://shahar.internal.aiola.ai/api/tts/synthesize', {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to synthesize speech');
    }
  
    const blob = await response.blob();
    return URL.createObjectURL(blob); // Create a URL to play the audio
  }
  
  document.getElementById('synthesize-button').addEventListener('click', async () => {
    const textInput = document.getElementById('text-input').value.trim();
    const voiceFileInput = document.getElementById('voice-file').files[0];
    const voiceTextInput = document.getElementById('voice-text').value.trim();
  
    if (!textInput) {
      alert('Please enter text to synthesize.');
      return;
    }
  
    try {
      const audioUrl = await synthesizeSpeech(textInput, voiceFileInput, voiceTextInput);
      const audioPlayer = document.getElementById('audio-player');
      audioPlayer.src = audioUrl;
      audioPlayer.play();
    } catch (error) {
      console.error('Error synthesizing speech:', error.message);
      alert(`Error: ${error.message}`);
    }
  });