import { nanoid } from "nanoid";
import { TranscribeFileRequest, TranscribeFileResponse, SttStreamRequest } from "../../lib/types";
import { AbstractClient } from "../AbstractClient";
import { AiolaError } from "../../lib/errors";
import { StreamingClient } from "./streaming";
import FormData from 'form-data'
import { DEFAULT_WORKFLOW_ID } from "../../lib/constants";

export class Stt extends AbstractClient {
  private readonly path = "/api/voice-streaming/socket.io";
  private readonly namespace = "/events";

  public async stream(requestOptions: SttStreamRequest): Promise<StreamingClient> {
    const url: string = this.getWebSocketUrl();
    const accessToken = await this.auth.getAccessToken(this.options);
    const { query, headers } = this.buildQueryAndHeaders(requestOptions, accessToken);
    
    const socket: StreamingClient = new StreamingClient({ url, path: this.path, query, headers });

    if (!socket) {
      throw new AiolaError({ message: "Failed to connect to Streaming service" });
    }

    return socket;
  }

  public async transcribeFile(requestOptions: TranscribeFileRequest): Promise<TranscribeFileResponse> {
    const formData = new FormData();
    formData.append("file", requestOptions.file);
    
    if (requestOptions.language) {
      formData.append("language", requestOptions.language);
    }
    
    if (requestOptions.keywords) {
      formData.append("keywords", JSON.stringify(requestOptions.keywords));
    }

    const response = await this.fetch('/api/speech-to-text/file', {
      method: "POST",
      body: formData as unknown as BodyInit,
      headers: formData.getHeaders()
    });

    return response.json();
  }

  private getWebSocketUrl(): string {
    return `${this.baseUrl}${this.namespace}`;
  }

  private buildQueryAndHeaders(requestOptions: SttStreamRequest, accessToken: string): { query: Record<string, string>, headers: Record<string, string> } {
    const executionId = requestOptions.executionId || nanoid();

    const query = {
      execution_id: executionId,
      "x-aiola-api-token": accessToken,
    }

    const headers = {
      "X-Execution-Id": executionId,
      "X-Workflow-Id": requestOptions.workflowId || DEFAULT_WORKFLOW_ID,
      "x-lang-code": requestOptions.langCode || "en",
      "x-time-zone": requestOptions.timeZone || "UTC",
    }

    return { query, headers };
  }
}