import { InMemoryTransport } from '../inMemoryTransport';
import { TransportMessage } from '../transport';

describe('InMemoryTransport', () => {
  let transport: InMemoryTransport;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  it('should handle basic send/subscribe pattern', async () => {
    const message: TransportMessage<string> = {
      type: 'TEST',
      payload: 'Hello World'
    };

    const receivedMessages: string[] = [];
    await transport.subscribe<string>('test-channel', async (msg) => {
      receivedMessages.push(msg.payload);
    });

    await transport.send('test-channel', message);
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(receivedMessages).toEqual(['Hello World']);
  });

  it('should handle request/response pattern', async () => {
    // Set up a handler that will respond to requests
    await transport.subscribe('echo', async (msg: TransportMessage<string>) => {
      const responseChannel = msg.metadata?.responseChannel as string;
      if (responseChannel) {
        await transport.send(responseChannel, {
          type: 'RESPONSE',
          payload: `Echo: ${msg.payload}`
        });
      }
    });

    const response = await transport.request<string, string>(
      'echo',
      {
        type: 'ECHO_REQUEST',
        payload: 'Hello'
      }
    );

    expect(response).toBe('Echo: Hello');
  });

  it('should handle request timeout', async () => {
    await expect(
      transport.request(
        'non-existent',
        {
          type: 'TEST',
          payload: 'Hello'
        },
        { timeout: 100 }
      )
    ).rejects.toThrow('Request timeout after 100ms');
  });

  it('should handle multiple subscribers', async () => {
    const receivedMessages1: string[] = [];
    const receivedMessages2: string[] = [];

    await transport.subscribe<string>('broadcast', async (msg) => {
      receivedMessages1.push(msg.payload);
    });

    await transport.subscribe<string>('broadcast', async (msg) => {
      receivedMessages2.push(msg.payload);
    });

    await transport.send('broadcast', {
      type: 'BROADCAST',
      payload: 'Hello Everyone'
    });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedMessages1).toEqual(['Hello Everyone']);
    expect(receivedMessages2).toEqual(['Hello Everyone']);
  });

  it('should handle unsubscribe', async () => {
    const receivedMessages: string[] = [];

    await transport.subscribe<string>('test-channel', async (msg) => {
      receivedMessages.push(msg.payload);
    });

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'Message 1'
    });

    await transport.unsubscribe('test-channel');

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'Message 2'
    });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedMessages).toEqual(['Message 1']);
  });
}); 