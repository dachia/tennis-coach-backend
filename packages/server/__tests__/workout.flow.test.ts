import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Workout } from '../../workout/models/Workout';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { Exercise } from '../../exercise/models/Exercise';
import { WorkoutStatus } from '../../workout/types';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import jwt from 'jsonwebtoken';

describe("Workout Flow", () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coachToken: string;
  let traineeToken: string;
  let coach: any;
  let trainee: any;
  let exercise: any;
  let template: any;

  beforeAll(async () => {
    const { uri, closeDatabase: closeDatabaseFn } = await setupTestDatabase();
    closeDatabase = closeDatabaseFn;

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
    await mongoose.connection.dropDatabase();

    // Create test users
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
    coachToken = jwt.sign({ sub: coach._id, role: coach.role }, testConfig.jwtSecret);
    traineeToken = jwt.sign({ sub: trainee._id, role: trainee.role }, testConfig.jwtSecret);

    // Create test exercise and template
    exercise = await Exercise.create({
      title: 'Test Exercise',
      description: 'Test Description',
      media: ['https://example.com/test.mp4'],
      createdBy: coach._id
    });

    template = await TrainingTemplate.create({
      title: 'Test Template',
      description: 'Test Description',
      exerciseIds: [exercise._id],
      createdBy: coach._id
    });
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  describe("Complete Workout Flow", () => {
    it("should handle calendar view workout fetching", async () => {
      // Create some test workouts for different dates
      const workoutDate = new Date();
      const workout = await Workout.create({
        traineeId: trainee._id,
        workoutDate,
        startTimestamp: workoutDate,
        status: WorkoutStatus.PLANNED,
        templateId: template._id
      });

      // Fetch workouts for specific date
      const response = await request(app)
        .get('/workout/calendar')
        .query({ date: workoutDate.toISOString() })
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.workouts).toHaveLength(1);
      expect(response.body.data.payload.workouts[0]).toMatchObject({
        workoutDate: workoutDate.toISOString(),
        templateId: template._id.toString()
      });
    });

    it("should handle workout history viewing", async () => {
      // Create multiple workouts with different dates
      const dates = [
        new Date(),
        new Date(Date.now() - 86400000), // Yesterday
        new Date(Date.now() - 172800000) // Day before yesterday
      ];

      for (const date of dates) {
        await Workout.create({
          traineeId: trainee._id,
          workoutDate: date,
          startTimestamp: date,
          status: WorkoutStatus.COMPLETED,
          templateId: template._id
        });
      }

      const response = await request(app)
        .get('/workout/history')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.workouts).toHaveLength(3);
    });

    it.only("should handle empty workout creation", async () => {
      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date()
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(workoutData);

      expect(response.status).toBe(201);
      expect(response.body.data.payload.workout).toMatchObject({
        workoutDate: expect.any(String),
        startTimestamp: expect.any(String)
      });
    });
  });
}); 