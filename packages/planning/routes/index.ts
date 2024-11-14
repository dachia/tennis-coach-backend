import { Router } from 'express';
import { PlanningController } from '../controllers/planningController';
import { Container } from '../../shared';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
import { UserRole } from '../../auth/types';
import { User } from '../../auth/models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const planningController = container.get<PlanningController>('PlanningController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  // Plan management routes
  router.post(
    '/plan',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.createPlan.bind(planningController)
  );

  router.put(
    '/plan/:id',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.updatePlan.bind(planningController)
  );

  router.delete(
    '/plan/:id',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.deletePlan.bind(planningController)
  );

  router.get(
    '/plan/:id',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.getPlan.bind(planningController)
  );

  // Plan query routes
  router.get(
    '/plans',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.getPlansForUser.bind(planningController)
  );

  router.get(
    '/plans/trainee/:traineeId',
    authMiddleware,
    requireRole([UserRole.COACH]),
    planningController.getPlansForTrainee.bind(planningController)
  );

  router.get(
    '/plans/dates',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.getPlannedDates.bind(planningController)
  );

  // Scheduling routes
  router.post(
    '/schedule',
    authMiddleware,
    requireRole([UserRole.TRAINEE, UserRole.COACH]),
    planningController.scheduleWorkout.bind(planningController)
  );


  return router;
} 