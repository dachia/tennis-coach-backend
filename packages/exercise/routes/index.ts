import { Router } from 'express';
import { ExerciseController } from '../controllers/exerciseController';
import { Container } from '../../shared';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
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

  // Add this route after existing routes
  router.get(
    '/exercises',
    authMiddleware,
    exerciseController.getExercises.bind(exerciseController)
  );

  router.delete(
    '/exercise/:id',
    authMiddleware,
    exerciseController.deleteExercise.bind(exerciseController)
  );

  router.get(
    '/shares/:id',
    authMiddleware,
    exerciseController.getResourceShares.bind(exerciseController)
  );

  router.delete(
    '/template/:id',
    authMiddleware,
    exerciseController.deleteTemplate.bind(exerciseController)
  );

  // Add this route after existing routes
  router.get(
    '/templates',
    authMiddleware,
    exerciseController.getTemplates.bind(exerciseController)
  );

  router.get(
    '/exercise/:id',
    authMiddleware,
    exerciseController.getExercise.bind(exerciseController)
  );

  router.get(
    '/template/:id',
    authMiddleware,
    exerciseController.getTemplate.bind(exerciseController)
  );

  // Add this route after existing routes
  router.post(
    '/exercises/by-ids',
    authMiddleware,
    exerciseController.getExercisesByIds.bind(exerciseController)
  );

  return router;
} 