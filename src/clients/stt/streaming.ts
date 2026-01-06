import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  StreamingEventName,
  StreamingEventData,
  ValidEventName,
  SchemaValues,
  SetSchemaValuesResponse,
  BinaryDataMetadata,
} from "../../lib/types/StreamingEvents";

export interface StreamingClientOptions {
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export class StreamingClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor(options: StreamingClientOptions) {
    const { url, path, query, headers } = options;

    this.socket = io(url, {
      path,
      query,
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      withCredentials: true,
      extraHeaders: headers,
      transportOptions: {
        polling: {
          extraHeaders: headers,
        },
        websocket: {
          extraHeaders: headers,
        },
      },
    });
  }

  /**
   * Send audio data to the streaming service
   * @param audioData - Audio data buffer to send
   * @param metadata - Optional metadata to send with the audio chunk (e.g., { sub_flow_id: 'container-123' })
   */
  send(audioData: Buffer, metadata?: BinaryDataMetadata): void {
    if (metadata) {
      this.socket.emit("binary_data", audioData, metadata);
    } else {
      this.socket.emit("binary_data", audioData);
    }
  }

  /**
   * Listen to streaming events with type safety
   * @param event - Event name to listen to
   * @param listener - Event listener function
   */
  on<T extends ValidEventName>(
    event: T,
    listener: T extends StreamingEventName
      ? (data: StreamingEventData<T>) => void
      : T extends "connect" | "disconnect"
        ? () => void
        : T extends "error" | "connect_error"
          ? (error: Error) => void
          : never,
  ): this {
    (this.socket as Socket).on(
      event as string,
      listener as (...args: unknown[]) => void,
    );
    return this;
  }

  /**
   * Remove event listener
   * @param event - Event name
   * @param listener - Event listener function to remove
   */
  off<T extends ValidEventName>(
    event: T,
    listener?: T extends StreamingEventName
      ? (data: StreamingEventData<T>) => void
      : T extends "connect" | "disconnect"
        ? () => void
        : T extends "error" | "connect_error"
          ? (error: Error) => void
          : never,
  ): this {
    (this.socket as Socket).off(
      event as string,
      listener as ((...args: unknown[]) => void) | undefined,
    );
    return this;
  }

  /**
   * Set keywords for the streaming session
   * @param keywords - Keywords to set
   */
  setKeywords(keywords: Record<string, string>): void {
    this.socket.emit("set_keywords", new TextEncoder().encode(JSON.stringify(keywords)));
  }

  /**
   * Set schema values for the streaming session
   * @param schemaValues - Schema values to set (key path divided by "." mapped to list of option values)
   * @param callback - Optional callback to handle the acknowledgment response
   * @example
   * ```typescript
   * // Using acknowledgment callback for immediate response
   * streamingClient.setSchemaValues(
   *   {
   *     "contact.name": ["John Doe", "Jane Smith", "Bob Johnson"],
   *     "contact.email": ["john@example.com", "jane@example.com"]
   *   },
   *   (response) => {
   *     if (response.status === "ok") {
   *       console.log("Schema values set successfully");
   *     } else {
   *       console.error("Error:", response.error);
   *     }
   *   }
   * );
   *
   * // Listen for schema_values_updated event (when values are actually updated on server)
   * streamingClient.on("schema_values_updated", (data) => {
   *   console.log("Schema values updated:", data.schemaValues);
   *   console.log("Timestamp:", data.timestamp);
   * });
   * ```
   */
  setSchemaValues(
    schemaValues: SchemaValues,
    callback?: (response: SetSchemaValuesResponse) => void
  ): void {
    const encodedData = new TextEncoder().encode(JSON.stringify(schemaValues));

    if (callback) {
      this.socket.emit("set_schema_values", encodedData, callback);
    } else {
      this.socket.emit("set_schema_values", encodedData);
    }
  }

  /**
   * Connect to the streaming service
   */
  connect(): this {
    this.socket.connect();
    return this;
  }

  /**
   * Disconnect from the streaming service
   */
  disconnect(): this {
    this.socket.disconnect();
    return this;
  }

  /**
   * Check if socket is connected
   */
  get connected(): boolean {
    return this.socket.connected;
  }

  /**
   * Get the socket ID
   */
  get id(): string | undefined {
    return this.socket.id;
  }
}
