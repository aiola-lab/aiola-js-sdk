import { TtsRequest } from "../../lib/types";
import { AiolaError } from "../../lib/errors";
import { AbstractClient } from "../AbstractClient";

export class Tts extends AbstractClient {
  public async stream(
    requestOptions: TtsRequest,
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await this.fetch("/api/tts/stream", {
        method: "POST",
        body: JSON.stringify(requestOptions),
        headers: {
          Accept: "audio/*",
        },
      });

      if (!response.body) {
        throw await AiolaError.fromResponse(response);
      }

      return response.body;
    } catch (err) {
      throw err;
    }
  }

  public async synthesize(
    requestOptions: TtsRequest,
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await this.fetch("/api/tts/synthesize", {
        method: "POST",
        body: JSON.stringify(requestOptions),
        headers: {
          Accept: "audio/*",
        },
      });

      if (!response.body) {
        throw await AiolaError.fromResponse(response);
      }

      return response.body;
    } catch (err) {
      throw err;
    }
  }
}
