import { TransportMessage, TransportOptions, TransportHandler } from './transport';
import { BaseTransport } from './baseTransport';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class InMemoryTransport extends BaseTransport {
  private pendingRequests: Map<string, PendingRequest> = new Map();

  constructor() {
    super();
    this.connected = false;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    // Clean up any pending requests
    for (const [, request] of this.pendingRequests) {
      clearTimeout(request.timer);
      request.reject(new Error('Transport disconnected'));
    }
    this.pendingRequests.clear();
    this.handlers.clear();
  }

  async send<T = unknown>(
    channel: string,
    message: TransportMessage<T>,
    options?: TransportOptions
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    const mergedOptions = this.mergeOptions(options);
    const handlers = this.handlers.get(channel) || [];

    // Process handlers asynchronously
    setTimeout(async () => {
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error(`Handler error for channel ${channel}:`, error);
        }
      }
    }, 0);
  }

  async request<T = unknown, R = unknown>(
    channel: string,
    message: TransportMessage<T>,
    options?: TransportOptions
  ): Promise<R> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    const mergedOptions = this.mergeOptions(options);
    const correlationId = crypto.randomUUID();
    const responseChannel = `${channel}:response:${correlationId}`;

    return new Promise<R>((resolve, reject) => {
      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(responseChannel);
        reject(new Error(`Request timeout after ${mergedOptions.timeout}ms`));
      }, mergedOptions.timeout);

      // Store the pending request
      this.pendingRequests.set(responseChannel, { resolve, reject, timer });

      // Send the request with correlation ID
      const messageWithCorrelation: TransportMessage<T> = {
        ...message,
        metadata: {
          ...message.metadata,
          timestamp: Date.now(),
          correlationId,
          responseChannel
        }
      };

      // Handle the response
      this.subscribe(responseChannel, async (response: TransportMessage<R>) => {
        const pending = this.pendingRequests.get(responseChannel);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(responseChannel);
          this.unsubscribe(responseChannel);
          pending.resolve(response.payload);
        }
      });

      // Send the actual message
      this.send(channel, messageWithCorrelation, mergedOptions).catch((error) => {
        const pending = this.pendingRequests.get(responseChannel);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(responseChannel);
          this.unsubscribe(responseChannel);
          pending.reject(error);
        }
      });
    });
  }

  // Helper method to simulate responses (useful for testing)
  async simulateResponse<R>(correlationId: string, response: R): Promise<void> {
    const responseChannel = `response:${correlationId}`;
    const message = this.createMessage('RESPONSE', response);
    await this.send(responseChannel, message);
  }
} 