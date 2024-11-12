import { Transport } from '../transport';
import { TransportRequestMessage } from '../types/base';

export async function createTypedRequest<TRequest, TResponse>(
  transport: Transport,
  channel: string,
  payload: TRequest
): Promise<TResponse> {
  const message: TransportRequestMessage<TRequest> = {
    type: channel.toUpperCase(),
    payload,
    metadata: {
      timestamp: Date.now(),
      correlationId: Math.random().toString(36).substring(2, 15)
    }
  };

  return transport.request<TRequest, TResponse>(channel, message);
} 