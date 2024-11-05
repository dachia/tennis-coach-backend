import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createResponse } from '../utils/response.utils';

export interface AuthRequest extends Request {
  user?: any;
}

export const createAuthMiddleware = (getUserById: (id: string) => Promise<any>, jwtSecret: string) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, jwtSecret);
    const user = await getUserById(decoded.sub as string);
    
    if (!user) throw new Error();
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json(createResponse(
      'error',
      'Authentication required'
    ));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(createResponse(
        'error',
        'Forbidden'
      ));
    }
    next();
  };
}; 