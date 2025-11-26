import { nanoid } from "nanoid";
import {
  TranscribeFileRequest,
  TranscribeFileResponse,
  SttStreamRequest,
  QueryAndHeaders,
} from "../../lib/types";
import { AbstractClient } from "../AbstractClient";
import { AiolaError } from "../../lib/errors";
import { StreamingClient } from "./streaming";
import FormData from "form-data";
import { DEFAULT_WORKFLOW_ID } from "../../lib/constants";
import { prepareFileForFormData } from "../../lib/files";
import { RUNTIME } from "../../lib/runtime";

export class Stt extends AbstractClient {
  private readonly path = "/api/voice-streaming/socket.io";
  private readonly namespace = "/events";

  public async stream(
    requestOptions: SttStreamRequest
  ): Promise<StreamingClient> {
    const url: string = this.getWebSocketUrl();
    const accessToken = await this.auth.getAccessToken(this.options);
    const { query, headers } = this.buildQueryAndHeaders(
      requestOptions,
      accessToken
    );

    const socket: StreamingClient = new StreamingClient({
      url,
      path: this.path,
      query,
      headers,
    });

    if (!socket) {
      throw new AiolaError({
        message: "Failed to connect to Streaming service",
      });
    }

    return socket;
  }

  public async transcribeFile(
    requestOptions: TranscribeFileRequest
  ): Promise<TranscribeFileResponse> {
    // For Node.js, we need to properly handle FormData with the form-data package
    // For browser, we use the native FormData API
    let body: BodyInit;
    let additionalHeaders: Record<string, string> = {};

    if (RUNTIME.type === "node") {
      // Use the form-data package in Node.js
      const formData = new FormData();
      
      const { file, options } = prepareFileForFormData(requestOptions.file);
      
      if (options) {
        formData.append("file", file, options);
      } else {
        formData.append("file", file);
      }

      if (requestOptions.language) {
        formData.append("language", requestOptions.language);
      }

      if (requestOptions.keywords) {
        formData.append("keywords", JSON.stringify(requestOptions.keywords));
      }

      if (requestOptions.vadConfig) {
        formData.append("vad_config", JSON.stringify(requestOptions.vadConfig));
      }

      // Get the headers with Content-Type including boundary
      additionalHeaders = formData.getHeaders();
      
      // Convert to buffer for Node.js fetch
      body = formData.getBuffer() as unknown as BodyInit;
    } else {
      // Use native FormData in browser
      const formData = new (globalThis.FormData || FormData)();
      
      const { file } = prepareFileForFormData(requestOptions.file);
      
      // In browser, options are not used - File objects have their own metadata
      formData.append("file", file as File);

      if (requestOptions.language) {
        formData.append("language", requestOptions.language);
      }

      if (requestOptions.keywords) {
        formData.append("keywords", JSON.stringify(requestOptions.keywords));
      }

      if (requestOptions.vadConfig) {
        formData.append("vad_config", JSON.stringify(requestOptions.vadConfig));
      }

      body = formData as unknown as BodyInit;
    }

    const response = await this.fetch("/api/speech-to-text/file", {
      method: "POST",
      body,
      headers: additionalHeaders,
    });

    return response.json();
  }

  private getWebSocketUrl(): string {
    return `${this.baseUrl}${this.namespace}`;
  }

  private buildQueryAndHeaders(
    requestOptions: SttStreamRequest,
    accessToken: string
  ): QueryAndHeaders {
    const executionId = requestOptions.executionId || nanoid();

    const query: Record<string, string> = {
      execution_id: executionId,
      flow_id: requestOptions.workflowId || DEFAULT_WORKFLOW_ID,
      time_zone: requestOptions.timeZone || "UTC",
      "x-aiola-api-token": accessToken,
    };

    if (requestOptions.langCode) {
      query.lang_code = requestOptions.langCode;
    }

    if (requestOptions.tasksConfig) {
      query.tasks_config = JSON.stringify(requestOptions.tasksConfig);
    }

    if (requestOptions.keywords) {
      query.keywords = JSON.stringify(requestOptions.keywords);
    }

    if (requestOptions.vadConfig) {
      query.vad_config = JSON.stringify(requestOptions.vadConfig);
    }
    
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    return { query, headers };
  }

}
