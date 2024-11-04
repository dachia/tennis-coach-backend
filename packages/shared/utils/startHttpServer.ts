import { Express } from 'express';
import { globalErrorHandler } from '../middleware/errorHandler';

export async function startServer(app: Express, customConfig: { port: number }) {
  app.use(globalErrorHandler);
  const server = app.listen(customConfig.port, () => {
    console.log(`Server is running on port ${customConfig.port}`);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection', { reason, promise });
  });
  return server;
}