import { Router } from 'express';
import { ReportingController } from '../controllers/reportingController';
import { Container } from '../../shared';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
import { UserRole } from "../../shared/constants/UserRole";
import { User } from '../../auth/models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const reportingController = container.get<ReportingController>('ReportingController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  router.get(
    '/progress-comparison',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    reportingController.getProgressComparison.bind(reportingController)
  );

  router.get(
    '/progress-comparisons',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    reportingController.getProgressComparisons.bind(reportingController)
  );

  router.post(
    '/progress-comparison/calculate',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    reportingController.calculateProgressComparison.bind(reportingController)
  );

  router.post(
    '/total-progress/calculate',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    reportingController.calculateTotalProgress.bind(reportingController)
  );

  return router;
} 