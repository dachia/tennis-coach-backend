import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { Container } from '../../shared';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
import { UserRole } from '../types';
import { User } from '../models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const authController = container.get<AuthController>('AuthController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  router.post('/register', authController.register.bind(authController));
  router.post('/login', authController.login.bind(authController));

  // Protected routes
  router.get(
    '/coach/trainees',
    authMiddleware,
    requireRole([UserRole.COACH]),
    authController.getTraineesByCoach.bind(authController)
  );

  router.get(
    '/trainee/coach',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    authController.getCoachByTrainee.bind(authController)
  );

  return router;
}
