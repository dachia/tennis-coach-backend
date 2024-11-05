import { Transport, TransportMessage, TransportHandler } from './transport';

export interface RouteHandler<T = unknown, R = unknown> {
  (payload: T): Promise<R>;
}

export class TransportRouter {
  private routes: Map<string, RouteHandler> = new Map();
  
  constructor(private transport: Transport) {}

  /**
   * Register a route handler for a specific channel
   */
  register<T = unknown, R = unknown>(channel: string, handler: RouteHandler<T, R>) {
    this.routes.set(channel, handler as RouteHandler<unknown, unknown>);
  }

  /**
   * Start listening for transport requests
   */
  async listen() {
    for (const [channel, handler] of this.routes.entries()) {
      await this.transport.subscribe(channel, async (message: TransportMessage) => {
        try {
          const result = await handler(message.payload);
          
          // If there's a response channel, send the response back
          const responseChannel = message.metadata?.responseChannel as string;
          if (responseChannel) {
            await this.transport.send(responseChannel, {
              type: 'RESPONSE',
              payload: result
            });
          }
        } catch (error: any) {
          console.error(`Error handling message on channel ${channel}:`, error);
          
          // If there's a response channel, send the error back
          const responseChannel = message.metadata?.responseChannel as string;
          if (responseChannel) {
            await this.transport.send(responseChannel, {
              type: 'ERROR',
              payload: {
                message: error.message,
                code: error.code || 'INTERNAL_ERROR'
              }
            });
          }
        }
      });
    }
  }

  /**
   * Stop listening and clean up
   */
  async close() {
    for (const channel of this.routes.keys()) {
      await this.transport.unsubscribe(channel);
    }
    this.routes.clear();
  }
} 