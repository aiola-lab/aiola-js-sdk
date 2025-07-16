const fs = require("fs");
const path = require("path");
const { AiolaClient } = require("../../../dist/main/index.js");

async function transcribeFile() {
  const apiKey = process.env.AIOLA_API_KEY || 'YOUR_API_KEY';
  
  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({ apiKey });
    
    console.log("Access token generated successfully");
    
    // Step 2: Create client
    const client = new AiolaClient({ accessToken });

    // Step 3: Transcribe file
    const filePath = path.resolve(__dirname,  "path/to/your/audio.wav");
    const file = fs.createReadStream(filePath);
    
    const transcript = await client.stt.transcribeFile({
      file: file,
      language: "en"
    });

    console.log("Transcript:", transcript);
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

transcribeFile();