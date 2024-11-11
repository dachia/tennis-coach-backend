import { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/response.utils';
import { DomainError } from '../errors/DomainError';
import { AuthError } from '../errors';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error

  if (err instanceof DomainError) {
    // console.error('Domain error:', err.message);
    return res.status(err.statusCode).json(
      createResponse('fail', err.message)
    );
  }
  if (err instanceof AuthError) {
    // console.error('Auth error:', err.message);
    return res.status(err.statusCode).json(
      createResponse('fail', err.message)
    );
  }

  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
  });

  // Send a generic error response for unexpected errors
  res.status(500).json(
    createResponse('error', 'An unexpected error occurred', null, {
      message: err.message,
    })
  );
}
