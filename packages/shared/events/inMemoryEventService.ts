import { DomainEvent, EventService } from './eventService';
import { Transport, TransportMessage } from '../transport/transport';

export class InMemoryEventService implements EventService {
  constructor(private transport: Transport) {}

  async publishDomainEvent<E extends DomainEvent<any, any>>(event: E): Promise<void> {
    const message: TransportMessage<E['payload']> = {
      type: event.eventName,
      payload: event.payload
    };
    await this.transport.send(event.eventName, message);
  }

  async subscribeToDomainEvent<E extends DomainEvent<any, any>>(
    eventName: E['eventName'],
    callback: (payload: E['payload']) => void
  ): Promise<void> {
    await this.transport.subscribe(eventName, async (message) => {
      callback(message.payload);
    });
  }

  async unsubscribeFromDomainEvent(eventName: string): Promise<void> {
    await this.transport.unsubscribe(eventName);
  }
}
