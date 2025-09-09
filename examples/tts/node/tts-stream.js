const { AiolaClient } = require("../../../dist/index.js");

async function streamTts() {
  const apiKey = process.env.AIOLA_API_KEY || "YOUR_API_KEY";
  
  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({
      apiKey: apiKey
    });
    
    console.log("Access token generated successfully");
    
    // Step 2: Create client
    const client = new AiolaClient({
      accessToken: accessToken
    });
    
    // Step 3: Stream audio
    const stream = await client.tts.stream({
      text: "Hello, how can I help you today?",
      voice: "jess",
      language: "en",
    });
    
    const audioChunks = [];
    for await (const chunk of stream) {
      audioChunks.push(chunk);
    }

    console.log("Audio chunks received:", audioChunks.length);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

streamTts();