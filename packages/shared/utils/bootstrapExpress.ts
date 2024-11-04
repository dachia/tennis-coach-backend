import express, { Express } from 'express';
import cors from 'cors';

export function bootstrapApp(config?: any): Express {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Add health check endpoint
  return app;
}

