import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { startServer } from '../utils/startHttpServer';
import { Express } from 'express';

export async function setupTestDatabase() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  return {
    uri,
    closeDatabase: async () => {
      await mongoose.disconnect();
      await mongod.stop();
    }
  };
}
export async function setupTestServer(app: Express) {
  const testConfig = {
    port: 0,
  };
  const server = await startServer(app, testConfig);

  return {
    app,
    server,
    closeServer: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };
}
