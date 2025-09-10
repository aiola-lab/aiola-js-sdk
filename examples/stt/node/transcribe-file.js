const { readFile } = require("fs/promises");
const path = require("path");
const {
  AiolaClient,
} = require("../../../dist/index.js");

async function transcribeFile() {
  const apiKey =
    process.env.AIOLA_API_KEY || "<YOUR_API_KEY>";

  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({ apiKey });

    console.log("Access token generated successfully");

    // Step 2: Create client
    const client = new AiolaClient({ accessToken });

    // Step 3: Transcribe file
    const filePath = path.resolve(
      __dirname,
      "../assets/sample-en.wav" // TODO: change to your own path  
    );

    const file = await readFile(filePath);
    
    const transcript = await client.stt.transcribeFile({
      file: file,
      language: "en",
      keywords: {
        venus: "venuss", // "<word_to_catch>": "<word_transcribe>"
      },
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
