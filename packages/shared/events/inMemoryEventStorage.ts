import { EventStorage } from './eventStorage';

// In-memory implementation of EventStorage
export class InMemoryEventStorage implements EventStorage {
  private subscribers: Map<string, Array<(payload: any) => void>> = new Map();

  async addSubscriber(eventName: string, callback: (payload: any) => void): Promise<void> {
    const existingCallbacks = this.subscribers.get(eventName) || [];
    this.subscribers.set(eventName, [...existingCallbacks, callback]);
  }

  async removeSubscriber(eventName: string): Promise<void> {
    this.subscribers.delete(eventName);
  }

  async notifySubscribers(eventName: string, payload: any): Promise<void> {
    const callbacks = this.subscribers.get(eventName) || [];
    callbacks.forEach(callback => callback(payload));
  }
}
