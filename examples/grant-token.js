const { AiolaClient } = require("../dist/main/index.js");

async function grantToken() {
  try {
    const { accessToken } = await AiolaClient.grantToken({ apiKey: AIOLA_API_KEY });
    
    // Save the token
    console.log(`Token: ${accessToken}`);

    // Create a new client using only the access token
    const clientWithToken = new AiolaClient({ accessToken });

    console.log("Client created successfully with access token");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

grantToken();