const fs = require("fs");
const path = require("path");
const { AiolaClient } = require("../../../dist/main/index.js");



const AIOLA_API_KEY = process.env.AIOLA_API_KEY || 'YOUR_API_KEY';

const client = new AiolaClient({
  apiKey: AIOLA_API_KEY,
});

async function transcribeFile() {

  const filePath = path.resolve(__dirname, "./audio.wav");
  
  const file = fs.createReadStream(filePath);
  
  try {
    const transcript = await client.stt.transcribeFile({ 
      file: file,
      language: "en"
    });

    console.log(transcript);
  } catch (error) {
    console.error(error);
  }
}

transcribeFile();