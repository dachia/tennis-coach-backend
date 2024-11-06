import { Router } from 'express';
import { ExerciseController } from '../controllers/exerciseController';
import { Container } from '../../shared';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
import { UserRole } from '../../auth/types';
import { User } from '../../auth/models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const exerciseController = container.get<ExerciseController>('ExerciseController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  // Exercise routes
  router.post(
    '/exercise',
    authMiddleware,
    exerciseController.createExercise.bind(exerciseController)
  );

  // Template routes
  router.post(
    '/template',
    authMiddleware,
    exerciseController.createTemplate.bind(exerciseController)
  );

  // Sharing routes
  router.post(
    '/share',
    authMiddleware,
    exerciseController.shareResource.bind(exerciseController)
  );

  // Add these routes after the existing ones
  router.put(
    '/exercise/:id',
    authMiddleware,
    exerciseController.updateExercise.bind(exerciseController)
  );

  router.put(
    '/kpi/:id',
    authMiddleware,
    exerciseController.updateKpi.bind(exerciseController)
  );

  router.put(
    '/template/:id',
    authMiddleware,
    exerciseController.updateTemplate.bind(exerciseController)
  );

  // Add this route after the existing ones
  router.delete(
    '/share/:id',
    authMiddleware,
    exerciseController.deleteSharedResource.bind(exerciseController)
  );

  router.put(
    '/exercise/:id/with-kpis',
    authMiddleware,
    exerciseController.updateExerciseWithKPIs.bind(exerciseController)
  );

  return router;
} 