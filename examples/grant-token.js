const { AiolaClient } = require("../dist/main/index.js");

async function grantToken() {
  const apiKey = process.env.AIOLA_API_KEY || 'YOUR_API_KEY';

  try {
    const { accessToken } = await AiolaClient.grantToken({ apiKey });
    
    // Save the token
    console.log(`Token: ${accessToken}`);

    // Create a new client using only the access token
    const clientWithToken = new AiolaClient({
      accessToken: accessToken,
    });

    console.log("Client created successfully with access token");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

grantToken();