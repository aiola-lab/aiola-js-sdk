export interface AiolaErrorOptions {
  /**
   * Human-readable description of the error. Will be available in the `.message` property as well.
   */
  message: string;
  /**
   * Human-readable reason of the error from the server. Will be available in the `.reason` property as well.
   */
  reason?: string;
  /**
   * HTTP status code (when the error originates from an HTTP response).
   */
  status?: number;
  /**
   * Optional machine-readable error code coming from the API.
   */
  code?: string;
  /**
   * Any additional information that may help debugging the problem.
   */
  details?: unknown;
}

/**
 * All errors thrown by this SDK are instances of `AiolaError`.
 *
 * Keeping a single error shape makes it easier to handle failures in a
 * predictable way on the client side. Consumers can check for
 * `instanceof AiolaError` or inspect the provided metadata.
 */
export class AiolaError extends Error {
  public readonly reason?: string;
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor({ message, reason, status, code, details }: AiolaErrorOptions) {
    super(message);

    // Set the error name explicitly so it does not get minified/uglified in some bundlers.
    this.name = "AiolaError";

    this.reason = reason;
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /**
   * Builds an `AiolaError` instance from a failed `fetch` response.
   * Tries to parse the body as JSON (preferred) or text in order to extract
   * meaningful error information coming from the server.
   */
  static async fromResponse(response: Response): Promise<AiolaError> {
    const message = `Request failed with status ${response.status}`;
    let reason: string | undefined;
    let code: string | undefined;
    let details: unknown;

    try {
      // Read the response body once as text to avoid stream consumption issues
      const responseText = await response.text();

      if (responseText) {
        // Try to parse as JSON first
        const payload = JSON.parse(responseText);

        if (typeof payload === "object" && payload !== null) {
          // The AIOLA API typically wraps the error under an `error` property but
          // we also fall back to common shapes.
          const errPayload =
            "error" in payload && typeof payload.error === "object"
              ? payload.error
              : payload;

          reason = errPayload.message;
          code = errPayload.code;
          details = errPayload.details ?? errPayload;
        }
      }
    } catch (textError) {
      // If we can't read the response body at all, include error info
      details = {
        textError:
          textError instanceof Error ? textError.message : String(textError),
        responseInfo: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
            ? Object.fromEntries(response.headers.entries())
            : {},
        },
      };
    }

    return new AiolaError({ message, reason, status: response.status, code, details });
  }


  toString() {
    const parts = [this.message];
    if (this.reason) parts.push(`Reason: ${this.reason}`);
    return parts.join(' | ');
  }
}
