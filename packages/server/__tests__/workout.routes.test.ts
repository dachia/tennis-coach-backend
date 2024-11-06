import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { bootstrapServer } from '../server';
import { testConfig } from '../config';
import { createTestContainer } from '../di';
import jwt from 'jsonwebtoken';
import { User } from '../../auth/models/User';
import { Workout } from '../../workout/models/Workout';
import { WorkoutStatus, ExerciseLogStatus } from '../../workout/types';
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { KPI } from '../../exercise/models/KPI';

describe('Workout Routes', () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coach: any;
  let trainee: any;
  let coachToken: string;
  let traineeToken: string;

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

    coachToken = jwt.sign({ sub: coach._id, role: coach.role }, testConfig.jwtSecret);
    traineeToken = jwt.sign({ sub: trainee._id, role: trainee.role }, testConfig.jwtSecret);
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  describe('POST /workout/workout', () => {
    let template: any;

    beforeEach(async () => {
      const exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://example.com/test.mp4'],
        createdBy: coach._id
      });

      template = await TrainingTemplate.create({
        title: 'Test Template',
        description: 'Test Description',
        exercises: [exercise._id],
        createdBy: coach._id
      });
    });

    it('should create a new workout successfully', async () => {
      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date(),
        endTimestamp: new Date(Date.now() + 3600000),
        templateId: template._id,
        notes: 'Test workout',
        media: ['https://example.com/workout.jpg']
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(workoutData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            workout: expect.objectContaining({
              workoutDate: expect.any(String),
              startTimestamp: expect.any(String),
              status: WorkoutStatus.PLANNED
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return 400 for invalid workout data', async () => {
      const invalidData = {
        workoutDate: 'invalid-date',
        startTimestamp: 'invalid-timestamp'
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should return 403 when coach tries to create workout', async () => {
      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date()
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(workoutData);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /workout/log', () => {
    let workout: any;
    let exercise: any;
    let kpi: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://example.com/test.mp4'],
        createdBy: coach._id
      });

      kpi = await KPI.create({
        exerciseId: exercise._id,
        goalValue: 10,
        unit: 'repetitions',
        performanceGoal: 'maximize'
      });

      workout = await Workout.create({
        traineeId: trainee._id,
        workoutDate: new Date(),
        startTimestamp: new Date(),
        status: WorkoutStatus.IN_PROGRESS
      });
    });

    it('should create a new exercise log successfully', async () => {
      const logData = {
        workoutId: workout._id,
        exerciseId: exercise._id,
        kpiId: kpi._id,
        actualValue: 10,
        duration: 300,
        notes: 'Test log',
        media: ['https://example.com/log.jpg']
      };

      const response = await request(app)
        .post('/workout/log')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(logData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            exerciseLog: expect.objectContaining({
              kpiId: kpi._id.toString(),
              actualValue: logData.actualValue,
              duration: logData.duration,
              status: ExerciseLogStatus.COMPLETED
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return 404 when logging for non-existent workout', async () => {
      const logData = {
        workoutId: new mongoose.Types.ObjectId(),
        exerciseId: exercise._id,
        kpiId: kpi._id,
        actualValue: 10,
        duration: 300
      };

      const response = await request(app)
        .post('/workout/log')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(logData);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /workout/workout/:id', () => {
    let workout: any;

    beforeEach(async () => {
      workout = await Workout.create({
        traineeId: trainee._id,
        workoutDate: new Date(),
        startTimestamp: new Date(),
        status: WorkoutStatus.PLANNED
      });
    });

    it('should update a workout successfully', async () => {
      const updateData = {
        status: WorkoutStatus.COMPLETED,
        notes: 'Updated notes',
        endTimestamp: new Date(workout.startTimestamp.getTime() + 3600000) // 1 hour after start
      };

      const response = await request(app)
        .put(`/workout/workout/${workout._id}`)
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            workout: expect.objectContaining({
              status: updateData.status,
              notes: updateData.notes
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });
  });
});
