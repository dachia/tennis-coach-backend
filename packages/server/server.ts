import { config as Config } from './config';
import { bootstrapApp } from './app';
import { startServer } from '../shared/utils/startHttpServer';

export async function bootstrapServer() {
  const app = await bootstrapApp(Config);
  const server = await startServer(app, Config);
  return server;
}
