import { DomainEvent, EventService } from './eventService';
import { EventStorage } from './eventStorage';

// Modified EventService to use storage
export class InMemoryEventService implements EventService {
  constructor(private storage: EventStorage) {}

  async publishDomainEvent<E extends DomainEvent<any, any>>(event: E): Promise<void> {
    await this.storage.notifySubscribers(event.eventName, event.payload);
  }

  async subscribeToDomainEvent<E extends DomainEvent<any, any>>(
    eventName: E['eventName'],
    callback: (payload: E['payload']) => void
  ): Promise<void> {
    await this.storage.addSubscriber(eventName, callback);
  }

  async unsubscribeFromDomainEvent(eventName: string): Promise<void> {
    await this.storage.removeSubscriber(eventName);
  }
}
