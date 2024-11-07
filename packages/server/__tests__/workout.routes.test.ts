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
import { ExerciseLog } from '../../workout/models/ExerciseLog';
import { SharedResource } from '../../exercise/models/SharedResource';
import { ResourceType } from '../../exercise/types';

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
    let exercise: any;
    let kpi: any;

    beforeEach(async () => {
      // Create exercise with KPI
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

      // Create template with exercise
      template = await TrainingTemplate.create({
        title: 'Test Template',
        description: 'Test Description',
        exerciseIds: [exercise._id],
        createdBy: coach._id
      });
      // Share template with trainee
      await SharedResource.create({
        resourceId: template._id,
        resourceType: ResourceType.TEMPLATE,
        sharedById: coach._id,
        sharedWithId: trainee._id
      });
    });

    it('should create a new workout successfully', async () => {
      const workoutData = {
        workoutDate: new Date(Date.now() + 86400000),
        startTimestamp: new Date(Date.now() + 86400000),
        endTimestamp: new Date(Date.now() + 90000000),
        templateId: template._id,
        notes: 'Test workout',
        media: ['https://example.com/workout.jpg']
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(workoutData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.error).toBeNull();
      expect(response.body.data.message).toEqual(expect.any(String));
      expect(response.body.data.payload.workout).toMatchObject({
        startTimestamp: expect.any(String),
        status: WorkoutStatus.PLANNED,
        templateId: template._id.toString(),
        traineeId: trainee._id.toString(),
        notes: workoutData.notes,
        media: workoutData.media
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


    it('should create a workout with exercise logs when template is provided', async () => {
      const workoutData = {
        workoutDate: new Date(Date.now() + 86400000),
        startTimestamp: new Date(Date.now() + 86400000),
        endTimestamp: new Date(Date.now() + 90000000),
        templateId: template._id,
        notes: 'Test workout',
        media: ['https://example.com/workout.jpg']
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(workoutData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            workout: expect.objectContaining({
              status: WorkoutStatus.PLANNED,
              templateId: template._id.toString(),
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });

      // Verify exercise logs were created
      const workout = await Workout.findById(response.body.data.payload.workout._id).lean();
      const exerciseLogs = await ExerciseLog.find({ workoutId: workout!._id }).lean();

      expect(exerciseLogs).toHaveLength(1); // One exercise in template
      expect(exerciseLogs[0]).toMatchObject({
        workoutId: workout!._id,
        exerciseId: exercise._id,
        kpiId: kpi._id,
        traineeId: coach._id,
        status: ExerciseLogStatus.PENDING,
        actualValue: 0,
        duration: 0
      });
    });

    it('should fail gracefully when template is not found', async () => {
      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date(),
        templateId: new mongoose.Types.ObjectId(), // Non-existent template
        notes: 'Test workout'
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(workoutData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();

      // Verify no workout was created
      const workouts = await Workout.find({ traineeId: trainee._id });
      expect(workouts).toHaveLength(0);
    });

    it('should handle template without exercises gracefully', async () => {
      // Create template without exercises
      const emptyTemplate = await TrainingTemplate.create({
        title: 'Empty Template',
        description: 'Template without exercises',
        exerciseIds: [],
        createdBy: coach._id
      });

      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date(),
        templateId: emptyTemplate._id,
        notes: 'Test workout'
      };

      const response = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(workoutData);

      expect(response.status).toBe(400);
    });

    it('should set correct status based on startTimestamp', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      const tomorrow = new Date(Date.now() + 86400000);
      const today = new Date();

      // Past workout
      const pastWorkout = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({ 
          workoutDate: yesterday,
          startTimestamp: yesterday 
        });

      expect(pastWorkout.body.data.payload.workout.status).toBe(WorkoutStatus.COMPLETED);

      // Today's workout
      const todayWorkout = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({ 
          workoutDate: today,
          startTimestamp: today 
        });

      expect(todayWorkout.body.data.payload.workout.status).toBe(WorkoutStatus.IN_PROGRESS);

      // Future workout
      const futureWorkout = await request(app)
        .post('/workout/workout')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({ 
          workoutDate: tomorrow,
          startTimestamp: tomorrow 
        });

      expect(futureWorkout.body.data.payload.workout.status).toBe(WorkoutStatus.PLANNED);
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
        .set('Authorization', `Bearer ${coachToken}`)
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
