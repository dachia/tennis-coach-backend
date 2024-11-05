export interface TransportMessage<T = unknown> {
  type: string;
  payload: T;
  metadata?: {
    timestamp: number;
    sender?: string;
    correlationId?: string;
    [key: string]: unknown;
  };
}

export interface TransportOptions {
  timeout?: number;
  retries?: number;
  metadata?: Record<string, unknown>;
}

export interface TransportHandler<T = unknown, R = unknown> {
  (message: TransportMessage<T>): Promise<R> | R;
}

export interface Transport {
  /**
   * Send a message to a specific channel/topic
   */
  send<T = unknown>(
    channel: string,
    message: TransportMessage<T>,
    options?: TransportOptions
  ): Promise<void>;

  /**
   * Request-response pattern implementation
   */
  request<T = unknown, R = unknown>(
    channel: string,
    message: TransportMessage<T>,
    options?: TransportOptions
  ): Promise<R>;

  /**
   * Subscribe to messages on a specific channel/topic
   */
  subscribe<T = unknown>(
    channel: string,
    handler: TransportHandler<T>,
    options?: TransportOptions
  ): Promise<void>;

  /**
   * Unsubscribe from a specific channel/topic
   */
  unsubscribe(channel: string): Promise<void>;

  /**
   * Connect to the transport layer
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the transport layer
   */
  disconnect(): Promise<void>;

  /**
   * Check if transport is connected
   */
  isConnected(): boolean;
}
