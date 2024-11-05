import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { testConfig } from '../../server/config';
import { bootstrapServer } from '../../server/server';

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