export interface DomainEvent<T, P> {
  eventName: T;
  payload: P;
}

export interface EventService {
  publishDomainEvent<E extends DomainEvent<any, any>>(event: E): Promise<void>;

  subscribeToDomainEvent<E extends DomainEvent<any, any>>(
    eventName: E['eventName'],
    callback: (payload: E['payload']) => void
  ): Promise<void>;

  unsubscribeFromDomainEvent(eventName: string): Promise<void>;
}
