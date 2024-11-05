import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { CoachTrainee } from '../../auth/models/CoachTrainee';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';

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

    // Connect to test database
    await mongoose.connect(uri);

    const { app: testApp, server: testServer, closeServer: closeServerFn } = await bootstrapServer({
      ...testConfig,
      mongoUri: uri,
    }, createTestContainer(testConfig));
    app = testApp;
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
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            trainees: expect.arrayContaining([
              expect.objectContaining({
                email: 'trainee@example.com'
              })
            ])
          }
        },
        error: null,
        version: expect.any(Number)
      });
      expect(response.body.data.payload.trainees).toHaveLength(1);
    });

    it('should not allow trainees to access this endpoint', async () => {
      const response = await request(app)
        .get('/auth/coach/trainees')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        status: 'error',
        data: null,
        error: {
          message: expect.any(String)
        },
        version: expect.any(Number)
      });
    });
  });

  describe('GET /auth/trainee/coach', () => {
    it('should return coach for an authenticated trainee', async () => {
      const response = await request(app)
        .get('/auth/trainee/coach')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            coach: expect.objectContaining({
              email: 'coach@example.com'
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should not allow coaches to access this endpoint', async () => {
      const response = await request(app)
        .get('/auth/trainee/coach')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        status: 'error',
        data: null,
        error: {
          message: expect.any(String)
        },
        version: expect.any(Number)
      });
    });
  });
}); 