import { Router } from 'express';
import { CalendarController } from '../controllers/calendarController';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
import { UserRole } from '../../shared';
import { Container } from '../../shared';
import { User } from '../../auth/models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const calendarController = container.get<CalendarController>('CalendarController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  router.get(
    '/events',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    calendarController.getCalendarEvents.bind(calendarController)
  );

  return router;
} 