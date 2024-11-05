import { Router } from 'express';
import { WorkoutController } from '../controllers/workoutController';
import { Container } from '../../shared';
import { createAuthMiddleware, requireRole } from '../../shared/middleware';
import { UserRole } from '../../auth/types';
import { User } from '../../auth/models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const workoutController = container.get<WorkoutController>('WorkoutController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  // Workout routes
  router.post(
    '/workout',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    workoutController.createWorkout.bind(workoutController)
  );

  router.put(
    '/workout/:id',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    workoutController.updateWorkout.bind(workoutController)
  );

  // Exercise log routes
  router.post(
    '/log',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    workoutController.createExerciseLog.bind(workoutController)
  );

  router.put(
    '/log/:id',
    authMiddleware,
    requireRole([UserRole.TRAINEE]),
    workoutController.updateExerciseLog.bind(workoutController)
  );

  return router;
} 