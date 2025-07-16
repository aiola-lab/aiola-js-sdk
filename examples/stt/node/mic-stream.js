const { AiolaClient } = require("../../../dist/main/index.js");
const { SoxRecording } = require("./sox.js"); // brew install sox

async function startStreaming() {
  const apiKey = process.env.AIOLA_API_KEY || 'YOUR_API_KEY';
  
  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({ apiKey });
    
    console.log("Access token generated successfully");
    
    // Step 2: Create client
    const client = new AiolaClient({ accessToken });
    
    // Step 3: Start streaming
    const connection = await client.stt.stream({
      langCode: "en",
    });

    connection.on('connect', () => {
      console.log("Connected to Streaming service");
      
      // brew install sox
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
    });

    connection.on('transcript', (data) => {
      console.log("Transcript:", data.transcript);
    });

    connection.on('disconnect', () => {
      console.log("Disconnected from Streaming service");
    });

    connection.on('error', (error) => {
      console.error("Streaming error:", error);
    });

    connection.connect();
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

startStreaming();