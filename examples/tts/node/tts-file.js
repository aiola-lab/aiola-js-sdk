const { AiolaClient } = require("../../../dist/main/index.js");
const fs = require("fs");

const AIOLA_API_KEY = process.env.AIOLA_API_KEY || "YOUR_API_KEY";

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});

async function createFile() {
  const audio = await client.tts.synthesize({
    text: "Hello, how can I help you today?",
    voice: "jess",
    language: "en",
  });

  const fileStream = fs.createWriteStream("./audio.wav");
  audio.pipe(fileStream);
}

createFile();