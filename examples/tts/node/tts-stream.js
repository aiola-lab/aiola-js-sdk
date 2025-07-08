const { AiolaClient } = require("../../../dist/main/index.js");

const AIOLA_API_KEY = process.env.AIOLA_API_KEY || "YOUR_API_KEY";

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});

async function streamTts() {
  const stream = await client.tts.stream({
    text: "Hello, how can I help you today?",
    voice: "jess",
    language: "en",
  });
  
  const audioChunks = [];
  for await (const chunk of stream) {
    audioChunks.push(chunk);
  }

  console.log(audioChunks);
}

streamTts();