import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from "../../shared/constants/UserRole";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { CoachTrainee } from '../../auth/models/CoachTrainee';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import { generateToken } from '../../shared/utils/auth';
import { Workout } from '../../workout/models/Workout';
import { Plan } from '../../planning/models/Plan';
import { WorkoutStatus } from '../../workout/types';
import { RecurrenceType } from '../../shared/types';

describe('Calendar Routes', () => {
  let trainee: any;
  let coach: any;
  let traineeToken: string;
  let coachToken: string;
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
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
    trainee = await User.create({
      email: 'trainee@example.com',
      password: 'password123',
      name: 'Test Trainee',
      role: UserRole.TRAINEE
    });

    coach = await User.create({
      email: 'coach@example.com',
      password: 'password123',
      name: 'Test Coach',
      role: UserRole.COACH
    });
    await CoachTrainee.create({
      coachId: coach._id,
      traineeId: trainee._id
    });



    coachToken = jwt.sign({ sub: coach._id, role: coach.role }, jwtSecret);
    traineeToken = jwt.sign({ sub: trainee._id, role: trainee.role }, jwtSecret);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Workout.deleteMany({});
    await Plan.deleteMany({});
    await CoachTrainee.deleteMany({});
    await closeServer();
    await closeDatabase();
  });

  describe('GET /calendar/events', () => {
    afterEach(async () => {
      await Workout.deleteMany({});
      await Plan.deleteMany({});
    });

    beforeEach(async () => {
      // Create coach-trainee relationship
      // Create workouts for the month
      const workoutDates = [
        new Date(),
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)  // 5 days ago
      ];

      for (const date of workoutDates) {
        await Workout.create({
          traineeId: trainee._id,
          startTimestamp: date,
          name: "Test Workout",
          status: WorkoutStatus.COMPLETED,
          traineeName: trainee.name,
          traineeEmail: trainee.email
        });
      }

      // Create plans for the month
      await Plan.create({
        traineeId: trainee._id,
        coachId: coach._id,
        name: "Weekly Plan",
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: ["monday", "wednesday", "friday"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        traineeName: trainee.name,
        traineeEmail: trainee.email
      });
    });

    it('should allow trainee to get their calendar events', async () => {
      const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get('/calendar/events')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.calendarEvents).toBeDefined();

      // Check if we have both workouts and plans
      const events = Object.values(response.body.data.payload.calendarEvents).flat();
      const workouts = events.filter((e: any) => e.type === 'workout');
      const plans = events.filter((e: any) => e.type === 'plan');

      expect(workouts.length).toBeGreaterThan(0);
      expect(plans.length).toBeGreaterThan(0);
    });

    it('should allow coach to get trainee calendar events', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get('/calendar/events')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          traineeId: trainee._id.toString()
        })
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.calendarEvents).toBeDefined();
    });

    it('should not allow coach to get calendar events for non-assigned trainee', async () => {
      const unauthorizedTrainee = await User.create({
        email: 'unauthorized.trainee@example.com',
        password: 'password123',
        name: 'Unauthorized Trainee',
        role: UserRole.TRAINEE
      });

      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get('/calendar/events')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          traineeId: unauthorizedTrainee._id.toString()
        })
        .set('Authorization', `Bearer ${coachToken}`);


      expect(response.status).toBe(400);
    });

    it('should validate date range parameters', async () => {
      const response = await request(app)
        .get('/calendar/events')
        .query({
          startDate: 'invalid-date',
          endDate: new Date().toISOString()
        })
        .set('Authorization', `Bearer ${traineeToken}`);
        

      expect(response.status).toBe(400);
    });
  });
}); 