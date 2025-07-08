import { nanoid } from "nanoid";
import { TranscribeFileRequest, TranscribeFileResponse, SttStreamRequest } from "../../lib/types";
import { AbstractClient } from "../AbstractClient";
import { AiolaError } from "../../lib/errors";
import { StreamingClient } from "./streaming";
import FormData from 'form-data'
import { DEFAULT_WORKFLOW_ID } from "../../lib/constants";

export class Stt extends AbstractClient {
  public path: string = "/api/voice-streaming/socket.io";
  public namespace: string = "/events";

  public async stream(requestOptions: SttStreamRequest): Promise<StreamingClient> {
    const url: string = this.getWebSocketUrl();
    const accessToken = await this.auth.getAccessToken(this.options);
    const query: Record<string, unknown> = this.buildQuery(requestOptions, accessToken);
    const socket: StreamingClient = new StreamingClient({ url, path: this.path, query, headers: {}, accessToken });

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

  private buildQuery(requestOptions: SttStreamRequest, accessToken: string): Record<string, unknown> {
    const query: Record<string, unknown> = {
      flow_id: requestOptions.workflowId || DEFAULT_WORKFLOW_ID,
      execution_id: requestOptions.executionId || nanoid(),
      lang_code: requestOptions.langCode || "en",
      time_zone: requestOptions.timeZone || "UTC",
      keywords: JSON.stringify(requestOptions.keywords || {}),
      ...(requestOptions.tasksConfig
        ? { tasks_config: JSON.stringify(requestOptions.tasksConfig) }
        : {}),
      "x-aiola-api-token": accessToken,
    };

    return query;
  }
}