import { config as Config } from './config';
import { bootstrapApp } from './app';
import { startServer } from '../shared/utils/startHttpServer';
import { Container, Transport } from '../shared';

export async function bootstrapServer(config: typeof Config, container: Container) {
  const transport = container.get<Transport>('Transport');
  await transport.connect();
  const app = await bootstrapApp(config, container);
  const server = await startServer(app, config);
  return {
    server,
    app,
    closeServer: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };
}
