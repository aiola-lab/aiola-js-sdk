import { AiolaClient } from "../../src/AiolaClient";
import { Auth } from "../../src/clients/auth/Client";

describe("AiolaClient", () => {
  const options = { apiKey: "test-api-key", baseUrl: "https://api.aiola.com" } as const;
  const client = new AiolaClient(options);

  it("should expose resolved options", () => {
    expect(client.options).toEqual({
      apiKey: "test-api-key",
      baseUrl: "https://api.aiola.com",
      authBaseUrl: "https://dev-vp1-uw2-auth.internal.aiola.ai",
      accessToken: undefined,
      workflowId: "9e153c70-288b-47a5-97a7-1f91273c2420"
    });
  });

  it("should lazily instantiate the STT client and reuse the same instance", () => {
    const stt1 = client.stt;
    const stt2 = client.stt;

    expect(stt1).toBeDefined();
    expect(stt1).toBe(stt2);
  });

  it("should lazily instantiate the TTS client and reuse the same instance", () => {
    const tts1 = client.tts;
    const tts2 = client.tts;

    expect(tts1).toBeDefined();
    expect(tts1).toBe(tts2);
  });

  describe("constructor", () => {
    it("should accept apiKey in options and resolve defaults", () => {
      const client = new AiolaClient({ apiKey: "test-key" });
      expect(client.options.apiKey).toBe("test-key");
      expect(client.options.baseUrl).toBe("https://dev-vp1-uw2-api.internal.aiola.ai");
      expect(client.options.authBaseUrl).toBe("https://dev-vp1-uw2-auth.internal.aiola.ai");
      expect(client.options.workflowId).toBe("9e153c70-288b-47a5-97a7-1f91273c2420");
    });

    it("should accept accessToken in options", () => {
      const client = new AiolaClient({ accessToken: "test-token" });
      expect(client.options.accessToken).toBe("test-token");
    });

    it("should accept baseUrl in options", () => {
      const client = new AiolaClient({ apiKey: "test-key", baseUrl: "https://custom.api.com" });
      expect(client.options.baseUrl).toBe("https://custom.api.com");
    });

    it("should accept authBaseUrl in options", () => {
      const client = new AiolaClient({ apiKey: "test-key", authBaseUrl: "https://custom.auth.com" });
      expect(client.options.authBaseUrl).toBe("https://custom.auth.com");
    });

    it("should accept workflowId in options", () => {
      const client = new AiolaClient({ apiKey: "test-key", workflowId: "custom-workflow-id" });
      expect(client.options.workflowId).toBe("custom-workflow-id");
    });
  });

  describe("getters", () => {
    let client: AiolaClient;

    beforeEach(() => {
      client = new AiolaClient({ apiKey: "test-key" });
    });

    it("should return stt client", () => {
      const stt = client.stt;
      expect(stt).toBeDefined();
      expect(typeof stt.stream).toBe("function");
      expect(typeof stt.transcribeFile).toBe("function");
    });

    it("should return tts client", () => {
      const tts = client.tts;
      expect(tts).toBeDefined();
      expect(typeof tts.stream).toBe("function");
      expect(typeof tts.synthesize).toBe("function");
    });

    it("should return auth client", () => {
      const auth = client.auth;
      expect(auth).toBeDefined();
      expect(typeof auth.grantToken).toBe("function");
    });

    it("should cache client instances", () => {
      const stt1 = client.stt;
      const stt2 = client.stt;
      expect(stt1).toBe(stt2);

      const tts1 = client.tts;
      const tts2 = client.tts;
      expect(tts1).toBe(tts2);

      const auth1 = client.auth;
      const auth2 = client.auth;
      expect(auth1).toBe(auth2);
    });
  });

  describe("static grantToken", () => {
    const mockApiKey = "ak_test123";
    const mockAccessToken = "access_token_456";

    it("should delegate to Auth.grantToken", async () => {
      // Spy on the Auth static method
      const authSpy = jest.spyOn(Auth, 'grantToken').mockResolvedValue(mockAccessToken);

      const result = await AiolaClient.grantToken({ apiKey: mockApiKey });

      expect(result).toBe(mockAccessToken);
      expect(authSpy).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        baseUrl: "https://dev-vp1-uw2-auth.internal.aiola.ai",
        workflowId: "9e153c70-288b-47a5-97a7-1f91273c2420"
      });

      authSpy.mockRestore();
    });

    it("should propagate errors from Auth.grantToken", async () => {
      const error = new Error("Token generation failed");
      const authSpy = jest.spyOn(Auth, 'grantToken').mockRejectedValue(error);

      await expect(AiolaClient.grantToken({ apiKey: mockApiKey })).rejects.toThrow(error);

      authSpy.mockRestore();
    });
  });
}); 