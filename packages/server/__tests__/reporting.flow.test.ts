import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { ExerciseLogStatus, WorkoutStatus } from '../../workout/types';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import jwt from 'jsonwebtoken';
import { CoachTrainee } from '../../auth/models/CoachTrainee';
import { ResourceType } from "../../shared/constants/PerformanceGoal";
import { KPI } from '../../exercise/models/KPI';

describe("Complete Reporting Flow", () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coachToken: string;
  let traineeToken: string;
  let coach: any;
  let trainee: any;

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

  it("should handle the complete flow from exercise creation to progress comparison", async () => {
    // 1. Coach creates an exercise with KPIs
    const exerciseData = {
      title: 'Bench Press',
      description: 'Basic bench press movement',
      media: ['https://example.com/bench.mp4'],
      kpis: [{
        goalValue: 100,
        unit: 'kg',
        performanceGoal: 'maximize'
      }]
    };

    const exerciseResponse = await request(app)
      .post('/exercise/exercise')
      .set('Authorization', `Bearer ${coachToken}`)
      .send(exerciseData);

    expect(exerciseResponse.status).toBe(201);
    const exerciseId = exerciseResponse.body.data.payload.exercise._id;
    const kpiId = exerciseResponse.body.data.payload.exercise.kpis[0]._id;

    // 2. Coach shares exercise with trainee
    const shareData = {
      resourceType: ResourceType.EXERCISE,
      resourceId: exerciseId,
      sharedWithId: trainee._id
    };

    const shareResponse = await request(app)
      .post('/exercise/share')
      .set('Authorization', `Bearer ${coachToken}`)
      .send(shareData);

    expect(shareResponse.status).toBe(201);

    // 3. Create first workout and log
    const firstWorkoutData = {
      name: 'First Workout',
      startTimestamp: new Date(),
      notes: 'Initial benchmark'
    };

    const firstWorkoutResponse = await request(app)
      .post('/workout/workout')
      .set('Authorization', `Bearer ${traineeToken}`)
      .send(firstWorkoutData);

    expect(firstWorkoutResponse.status).toBe(201);
    const firstWorkoutId = firstWorkoutResponse.body.data.payload.workout._id;

    // Add exercise to workout
    const addExerciseResponse = await request(app)
      .post(`/workout/workout/${firstWorkoutId}/exercise`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({ exerciseId });

    expect(addExerciseResponse.status).toBe(201);
    const firstLogId = addExerciseResponse.body.data.payload.exerciseLogs[0]._id;

    // Log first performance
    await request(app)
      .put(`/workout/log/${firstLogId}`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({
        actualValue: 80,
        status: ExerciseLogStatus.COMPLETED
      });

    // Complete first workout
    await request(app)
      .put(`/workout/workout/${firstWorkoutId}`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({
        status: WorkoutStatus.COMPLETED,
        endTimestamp: new Date()
      });

    // Wait for events to propagate
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Create second workout after some time
    const secondWorkoutData = {
      name: 'Progress Check',
      startTimestamp: new Date(),
      notes: 'Progress measurement'
    };

    const secondWorkoutResponse = await request(app)
      .post('/workout/workout')
      .set('Authorization', `Bearer ${traineeToken}`)
      .send(secondWorkoutData);

    const secondWorkoutId = secondWorkoutResponse.body.data.payload.workout._id;

    // Add exercise to second workout
    const addSecondExerciseResponse = await request(app)
      .post(`/workout/workout/${secondWorkoutId}/exercise`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({ exerciseId });

    const secondLogId = addSecondExerciseResponse.body.data.payload.exerciseLogs[0]._id;

    // Log improved performance
    await request(app)
      .put(`/workout/log/${secondLogId}`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({
        actualValue: 90,
        status: ExerciseLogStatus.COMPLETED
      });

    // Wait for events to propagate
    await new Promise(resolve => setTimeout(resolve, 100));
    //
    // Complete second workout
    await request(app)
      .put(`/workout/workout/${secondWorkoutId}`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({
        status: WorkoutStatus.COMPLETED,
        endTimestamp: new Date()
      });


    // 5. Check progress comparison
    const comparisonResponse = await request(app)
      .get(`/reporting/progress-comparison`)
      .query({
        logId: secondLogId,
        kpiId: kpiId,
        userId: trainee._id
      })
      .set('Authorization', `Bearer ${traineeToken}`);

    expect(comparisonResponse.status).toBe(200);
    expect(comparisonResponse.body.data.payload.progressComparison).toMatchObject({
      logId: secondLogId,
      kpiId: kpiId,
      userId: trainee._id.toString(),
      comparisonValue: 12.5, // First log value
      comparisonDate: expect.any(String)
    });

    // 6. Check total progress
    // const totalProgressResponse = await request(app)
    //   .get(`/reporting/total-progress`)
    //   .query({
    //     exerciseId,
    //     kpiId,
    //     userId: trainee._id,
    //     startDate: new Date(0).toISOString(),
    //     endDate: new Date().toISOString()
    //   })
    //   .set('Authorization', `Bearer ${traineeToken}`);

    // expect(totalProgressResponse.status).toBe(200);
    // expect(totalProgressResponse.body.data.payload.totalProgress).toMatchObject({
    //   exerciseId,
    //   kpiId,
    //   userId: trainee._id.toString(),
    //   progressValue: 10, // Difference between 90 and 80
    //   progressPercentage: 12.5 // (90-80)/80 * 100
    // });
  });
}); 