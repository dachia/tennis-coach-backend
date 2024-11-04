export interface EventStorage {
  addSubscriber(eventName: string, callback: (payload: any) => void): Promise<void>;
  removeSubscriber(eventName: string): Promise<void>;
  notifySubscribers(eventName: string, payload: any): Promise<void>;
}
