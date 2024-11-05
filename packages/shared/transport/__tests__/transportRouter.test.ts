import { TransportRouter } from '../transportRouter';
import { InMemoryTransport } from '../inMemoryTransport';
import { TransportMessage } from '../transport';

describe('TransportRouter', () => {
  let transport: InMemoryTransport;
  let router: TransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    router = new TransportRouter(transport);
  });

  afterEach(async () => {
    await router.close();
    await transport.disconnect();
  });

  it('should handle basic route registration and message handling', async () => {
    const handler = jest.fn().mockResolvedValue('response');
    router.register('test-channel', handler);
    await router.listen();

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'test-payload'
    });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledWith('test-payload');
  });

  it('should send response back when responseChannel is provided', async () => {
    const handler = jest.fn().mockResolvedValue('response-data');
    router.register('test-channel', handler);
    await router.listen();

    const responsePromise = new Promise<TransportMessage>(resolve => {
      transport.subscribe('response-channel', resolve);
    });

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'test-payload',
      metadata: {
        responseChannel: 'response-channel',
        timestamp: Date.now()
      }
    });

    const response = await responsePromise;
    expect(response).toMatchObject({
      type: 'RESPONSE',
      payload: 'response-data'
    });
  });

  it('should handle errors and send error response', async () => {
    const error = new Error('Test error');
    
    const handler = jest.fn().mockRejectedValue(error);
    router.register('test-channel', handler);
    await router.listen();

    const responsePromise = new Promise<TransportMessage>(resolve => {
      transport.subscribe('error-channel', resolve);
    });

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'test-payload',
      metadata: {
        responseChannel: 'error-channel',
        timestamp: Date.now()
      }
    });

    const response = await responsePromise;
    expect(response).toMatchObject({
      type: 'ERROR',
      payload: {
        message: 'Test error',
        code: 'INTERNAL_ERROR'
      }
    });
  });

  it('should handle multiple routes', async () => {
    const handler1 = jest.fn().mockResolvedValue('response1');
    const handler2 = jest.fn().mockResolvedValue('response2');

    router.register('channel1', handler1);
    router.register('channel2', handler2);
    await router.listen();

    await transport.send('channel1', {
      type: 'TEST',
      payload: 'payload1'
    });

    await transport.send('channel2', {
      type: 'TEST',
      payload: 'payload2'
    });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(handler1).toHaveBeenCalledWith('payload1');
    expect(handler2).toHaveBeenCalledWith('payload2');
  });

  it('should clean up subscriptions on close', async () => {
    const handler = jest.fn();
    router.register('test-channel', handler);
    await router.listen();
    
    await router.close();

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'test-payload'
    });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle errors without responseChannel', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');
    
    const handler = jest.fn().mockRejectedValue(error);
    router.register('test-channel', handler);
    await router.listen();

    await transport.send('test-channel', {
      type: 'TEST',
      payload: 'test-payload'
    });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error handling message on channel test-channel:',
      error
    );

    consoleErrorSpy.mockRestore();
  });
}); 