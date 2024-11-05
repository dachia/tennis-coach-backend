import { Transport, TransportMessage, TransportOptions, TransportHandler } from './transport';

export abstract class BaseTransport implements Transport {
  protected connected: boolean = false;
  protected handlers: Map<string, TransportHandler[]> = new Map();
  protected defaultOptions: TransportOptions = {
    timeout: 5000,
    retries: 3
  };

  abstract send<T = unknown>(
    channel: string,
    message: TransportMessage<T>,
    options?: TransportOptions
  ): Promise<void>;

  abstract request<T = unknown, R = unknown>(
    channel: string,
    message: TransportMessage<T>,
    options?: TransportOptions
  ): Promise<R>;

  async subscribe<T = unknown>(
    channel: string,
    handler: TransportHandler<T>,
    options?: TransportOptions
  ): Promise<void> {
    const existingHandlers = this.handlers.get(channel) || [];
    this.handlers.set(channel, [...existingHandlers, handler as TransportHandler<unknown>]);
  }

  async unsubscribe(channel: string): Promise<void> {
    this.handlers.delete(channel);
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  isConnected(): boolean {
    return this.connected;
  }

  protected mergeOptions(options?: TransportOptions): TransportOptions {
    return {
      ...this.defaultOptions,
      ...options,
      metadata: {
        ...this.defaultOptions.metadata,
        ...options?.metadata
      }
    };
  }

  protected createMessage<T>(type: string, payload: T, metadata?: Record<string, unknown>): TransportMessage<T> {
    return {
      type,
      payload,
      metadata: {
        timestamp: Date.now(),
        ...metadata
      }
    };
  }
} 