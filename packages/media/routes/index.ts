import { Router } from 'express';
import { MediaController } from '../controllers/mediaController';
import { Container } from '../../shared';
import { createAuthMiddleware } from '../../shared/middleware';
import { User } from '../../auth/models/User';

export function buildRoutes(container: Container) {
  const router = Router();
  const mediaController = container.get<MediaController>('MediaController');
  const config = container.get<any>('Config');
  const authMiddleware = createAuthMiddleware(
    async (id: string) => User.findById(id),
    config.jwtSecret
  );

  router.post(
    '/presigned-url',
    authMiddleware,
    mediaController.getPresignedUrl.bind(mediaController)
  );

  router.delete(
    '/media',
    authMiddleware,
    mediaController.deleteMedia.bind(mediaController)
  );

  return router;
} 