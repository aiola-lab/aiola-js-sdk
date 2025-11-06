const { AiolaClient } = require("../../../dist/index.js");
const { SoxRecording } = require("./sox.js"); // brew install sox

async function startStreaming() {
  const apiKey = process.env.AIOLA_API_KEY || "YOUR_API_KEY";

  try {
    // Step 1: Generate access token
    const { accessToken } = await AiolaClient.grantToken({
      apiKey,
      workflowId: "your-workflow-id",
    });

    console.log("Access token generated successfully");

    // Step 2: Create client
    const client = new AiolaClient({
      accessToken,
    });

    // Step 3: Start streaming
    const connection = await client.stt.stream({
      workflowId: "your-workflow-id",
      langCode: "en",
    });

    connection.on("connect", () => {
      console.log("Connected to Streaming service");

      // Set schema values with callback (immediate acknowledgment)
      const contactSchema = {
        "contact.name": [
          "John Doe",
          "Jane Smith",
          "Bob Johnson",
        ],
        "contact.email": [
          "john@example.com",
          "jane@example.com",
        ],
      };

      console.log("Setting schema values...");
      connection.setSchemaValues(contactSchema, (response) => {
        if (response.status === "ok") {
          console.log("Schema values set successfully");
        } else {
          console.error("Error setting schema values:", response);
        }
      });

      // brew install sox
      const recording = new SoxRecording({
        sampleRate: 16000,
        channels: 1,
        audioType: "wav",
      });

      const microphoneStream = recording.stream();

      microphoneStream.on("data", (chunk) => {
        connection.send(chunk);
      });

      microphoneStream.on("error", (err) => {
        console.error("Recording error:", err);
      });
    });

    // Listen for schema_values_updated event (when values are actually updated on server)
    connection.on("schema_values_updated", (data) => {
      console.log("Schema values updated on server:", data);
    });

    connection.on("transcript", (data) => {
      console.log("Transcript:", data.transcript);
    });

    connection.on("disconnect", () => {
      console.log("Disconnected from Streaming service");
    });

    connection.on("error", (error) => {
      console.error("Streaming error:", error);
    });

    connection.on("structured", (data) => {
      console.log("Structured:", JSON.stringify(data.results, null, 2));
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