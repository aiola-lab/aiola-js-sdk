import { AiolaClient } from "../../src/AiolaClient";
import { Auth } from "../../src/clients/auth/Client";
import { DEFAULT_BASE_URL, DEFAULT_AUTH_BASE_URL, DEFAULT_WORKFLOW_ID } from "../../src/lib/constants";

describe("AiolaClient", () => {
  const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Ll3PJnkCOWAAQPRVpLaKLBnNcFLJsYJvFKTjdwLKqHQ";
  const options = { accessToken, baseUrl: "https://api.aiola.com" } as const;
  const client = new AiolaClient(options);

  it("should expose resolved options", () => {
    expect(client.options).toEqual({
      accessToken,
      baseUrl: "https://api.aiola.com",
      authBaseUrl: DEFAULT_AUTH_BASE_URL,
      workflowId: DEFAULT_WORKFLOW_ID
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
    it("should accept accessToken in options and resolve defaults", () => {
      const client = new AiolaClient({ accessToken });
      expect(client.options.accessToken).toBe(accessToken);
      expect(client.options.baseUrl).toBe(DEFAULT_BASE_URL);
      expect(client.options.authBaseUrl).toBe(DEFAULT_AUTH_BASE_URL);
      expect(client.options.workflowId).toBe(DEFAULT_WORKFLOW_ID);
    });

    it("should accept baseUrl in options", () => {
      const client = new AiolaClient({ accessToken, baseUrl: "https://custom.api.com" });
      expect(client.options.baseUrl).toBe("https://custom.api.com");
    });

    it("should accept authBaseUrl in options", () => {
      const client = new AiolaClient({ accessToken, authBaseUrl: "https://custom.auth.com" });
      expect(client.options.authBaseUrl).toBe("https://custom.auth.com");
    });

    it("should accept workflowId in options", () => {
      const client = new AiolaClient({ accessToken, workflowId: "custom-workflow-id" });
      expect(client.options.workflowId).toBe("custom-workflow-id");
    });
  });

  describe("getters", () => {
    let client: AiolaClient;

    beforeEach(() => {
      client = new AiolaClient({ accessToken });
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
      expect(typeof Auth.grantToken).toBe("function");
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
      const authSpy = jest.spyOn(Auth, 'grantToken').mockResolvedValue({accessToken: mockAccessToken, sessionId: "session_789"});

      const result = await AiolaClient.grantToken({ apiKey: mockApiKey });

      expect(result).toEqual({accessToken: mockAccessToken, sessionId: "session_789"});
      expect(authSpy).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        baseUrl: DEFAULT_BASE_URL,
        authBaseUrl: DEFAULT_AUTH_BASE_URL,
        workflowId: DEFAULT_WORKFLOW_ID
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