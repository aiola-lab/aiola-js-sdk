import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents, StreamingEventName, StreamingEventData, ValidEventName } from "../../lib/types/StreamingEvents";

export interface StreamingClientOptions {
  url: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  accessToken: string;
}

export class StreamingClient {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  
    constructor(options: StreamingClientOptions) {
      const { url, path, query, headers, accessToken } = options;
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
        extraHeaders: {
          ...headers,
          "Authorization": `Bearer ${accessToken}`,
        }
      });
    }
  
    /**
     * Send audio data to the streaming service
     * @param audioData - Audio data buffer to send
     */
    send(audioData: Buffer): void {
      this.socket.emit('binary_data', audioData);
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
        : T extends 'connect' | 'disconnect'
        ? () => void
        : T extends 'error' | 'connect_error'
        ? (error: Error) => void
        : never
    ): this {
      (this.socket as Socket).on(event as string, listener as (...args: unknown[]) => void);
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
        : T extends 'connect' | 'disconnect'
        ? () => void
        : T extends 'error' | 'connect_error'
        ? (error: Error) => void
        : never
    ): this {
      (this.socket as Socket).off(event as string, listener as ((...args: unknown[]) => void) | undefined);
      return this;
    }
  
    /**
     * Set keywords for the streaming session
     * @param keywords - Keywords to set
     */
    setKeywords(keywords: Record<string, string>): void {
      this.socket.emit('setKeywords', keywords);
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