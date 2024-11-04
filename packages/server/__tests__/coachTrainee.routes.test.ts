import request from 'supertest';
import { Express } from 'express';
import { bootstrapApp, Container, InMemoryEventService, InMemoryEventStorage } from '../../shared';
import { addToContainer } from '../../auth/di';
import { setupTestDatabase, setupTestServer } from '../../shared/tests';
import { buildRoutes } from '../../auth/routes';
import { UserRole } from '../../auth/types';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { CoachTrainee } from '../../auth/models/CoachTrainee';

describe('Coach-Trainee Routes', () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coach: any;
  let trainee: any;
  let coachToken: string;
  let traineeToken: string;
  const jwtSecret = 'test-secret';

  beforeAll(async () => {
    const { uri, closeDatabase: closeDatabaseFn } = await setupTestDatabase();
    closeDatabase = closeDatabaseFn;
    await mongoose.connect(uri);

    app = bootstrapApp();
    const container = new Container();
    const config = { jwtSecret };
    container.register('Config', config);

    const eventStorage = new InMemoryEventStorage();
    const eventService = new InMemoryEventService(eventStorage);
    container.register('EventService', eventService);
    addToContainer(container);

    app.use('/auth', buildRoutes(container));

    const { server: testServer, closeServer: closeServerFn } = await setupTestServer(app);
    server = testServer;
    closeServer = closeServerFn;
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await CoachTrainee.deleteMany({});

    // Create a coach and trainee
    coach = await User.create({
      email: 'coach@example.com',
      password: 'password123',
      name: 'Coach User',
      role: UserRole.COACH
    });

    trainee = await User.create({
      email: 'trainee@example.com',
      password: 'password123',
      name: 'Trainee User',
      role: UserRole.TRAINEE
    });

    // Create tokens
    coachToken = jwt.sign({ sub: coach._id, role: coach.role }, jwtSecret);
    traineeToken = jwt.sign({ sub: trainee._id, role: trainee.role }, jwtSecret);

    // Create coach-trainee relationship
    await CoachTrainee.create({
      coachId: coach._id,
      traineeId: trainee._id
    });
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  describe('GET /auth/coach/trainees', () => {
    it('should return all trainees for an authenticated coach', async () => {
      const response = await request(app)
        .get('/auth/coach/trainees')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.trainees).toHaveLength(1);
      expect(response.body.trainees[0].email).toBe('trainee@example.com');
    });

    it('should not allow trainees to access this endpoint', async () => {
      const response = await request(app)
        .get('/auth/coach/trainees')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /auth/trainee/coach', () => {
    it('should return coach for an authenticated trainee', async () => {
      const response = await request(app)
        .get('/auth/trainee/coach')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.coach.email).toBe('coach@example.com');
    });

    it('should not allow coaches to access this endpoint', async () => {
      const response = await request(app)
        .get('/auth/trainee/coach')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 