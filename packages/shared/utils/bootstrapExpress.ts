import express, { Express } from 'express';
import cors from 'cors';

export function bootstrapApp(config?: any): Express {
  const app = express();
  app.use(cors());
  app.options('*', cors())
  app.use(express.json());

  // Add health check endpoint
  return app;
}

