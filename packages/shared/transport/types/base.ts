export interface BaseRequest {
  userId: string;
}

export interface TransportRequestMessage<T = unknown> {
  type: string;
  payload: T;
  metadata?: {
    timestamp: number;
    correlationId?: string;
    [key: string]: unknown;
  };
}

export interface TransportResponseMessage<T = unknown> {
  type: 'RESPONSE' | 'ERROR';
  payload: T;
  metadata?: {
    timestamp: number;
    correlationId?: string;
    [key: string]: unknown;
  };
} 