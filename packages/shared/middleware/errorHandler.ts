import { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/response.utils';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
  });

  // Send a generic error response to the client

  res.status(500).json(
    createResponse('error', 'An unexpected error occurred', null, {
      message: err.message,
    })
  );
}
