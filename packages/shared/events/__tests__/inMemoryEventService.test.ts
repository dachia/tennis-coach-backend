import { InMemoryTransport } from '../../transport/inMemoryTransport';
import { InMemoryEventService } from '../inMemoryEventService';
import { DomainEvent } from '../eventService';

interface TestEvent extends DomainEvent<'TEST_EVENT', string> {
  eventName: 'TEST_EVENT';
  payload: string;
}

describe('InMemoryEventService', () => {
  let transport: InMemoryTransport;
  let eventService: InMemoryEventService;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    eventService = new InMemoryEventService(transport);
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  it('should publish and receive domain events', async () => {
    const receivedPayloads: string[] = [];

    // Subscribe to test event
    await eventService.subscribeToDomainEvent<TestEvent>('TEST_EVENT', (payload) => {
      receivedPayloads.push(payload);
    });

    // Publish test event
    const testEvent: TestEvent = {
      eventName: 'TEST_EVENT',
      payload: 'Hello World'
    };
    await eventService.publishDomainEvent(testEvent);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedPayloads).toEqual(['Hello World']);
  });

  it('should handle multiple subscribers', async () => {
    const receivedPayloads1: string[] = [];
    const receivedPayloads2: string[] = [];

    // Subscribe multiple handlers
    await eventService.subscribeToDomainEvent<TestEvent>('TEST_EVENT', (payload) => {
      receivedPayloads1.push(payload);
    });
    await eventService.subscribeToDomainEvent<TestEvent>('TEST_EVENT', (payload) => {
      receivedPayloads2.push(payload);
    });

    // Publish test event
    const testEvent: TestEvent = {
      eventName: 'TEST_EVENT',
      payload: 'Hello World'
    };
    await eventService.publishDomainEvent(testEvent);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedPayloads1).toEqual(['Hello World']);
    expect(receivedPayloads2).toEqual(['Hello World']);
  });

  it('should handle unsubscribe', async () => {
    const receivedPayloads: string[] = [];

    // Subscribe to test event
    await eventService.subscribeToDomainEvent<TestEvent>('TEST_EVENT', (payload) => {
      receivedPayloads.push(payload);
    });

    // Publish first event
    await eventService.publishDomainEvent({
      eventName: 'TEST_EVENT',
      payload: 'Message 1'
    } as TestEvent);

    // Unsubscribe
    await eventService.unsubscribeFromDomainEvent('TEST_EVENT');

    // Publish second event
    await eventService.publishDomainEvent({
      eventName: 'TEST_EVENT',
      payload: 'Message 2'
    } as TestEvent);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedPayloads).toEqual(['Message 1']);
  });

  it('should handle events with different payloads', async () => {
    interface ComplexEvent extends DomainEvent<'COMPLEX_EVENT', { id: number; data: string }> {
      eventName: 'COMPLEX_EVENT';
      payload: { id: number; data: string };
    }

    const receivedPayloads: Array<{ id: number; data: string }> = [];

    await eventService.subscribeToDomainEvent<ComplexEvent>('COMPLEX_EVENT', (payload) => {
      receivedPayloads.push(payload);
    });

    const complexEvent: ComplexEvent = {
      eventName: 'COMPLEX_EVENT',
      payload: { id: 1, data: 'test' }
    };
    await eventService.publishDomainEvent(complexEvent);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedPayloads).toEqual([{ id: 1, data: 'test' }]);
  });
}); 