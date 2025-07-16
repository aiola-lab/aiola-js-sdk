const { AiolaClient } = require("../../../");
const fs = require("fs");

async function createFile() {
  const apiKey = process.env.AIOLA_API_KEY || "YOUR_API_KEY";
  
  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({
      apiKey: apiKey
    });
        
    // Step 2: Create client
    const client = new AiolaClient({ accessToken });
    
    // Step 3: Generate audio
    const audio = await client.tts.synthesize({
      text: "Hello, how can I help you today?",
      voice: "jess",
      language: "en",
    });

    const fileStream = fs.createWriteStream("./audio.wav");
    audio.pipe(fileStream);
    
    console.log("Audio file created successfully");
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

createFile();