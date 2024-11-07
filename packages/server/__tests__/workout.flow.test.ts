import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Workout } from '../../workout/models/Workout';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { Exercise } from '../../exercise/models/Exercise';
import { ExerciseLogStatus, WorkoutStatus } from '../../workout/types';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import jwt from 'jsonwebtoken';
import { CoachTrainee } from '../../auth/models/CoachTrainee';
import { ResourceType } from '../../exercise/types';

describe("Complete Workout Flow", () => {
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

    // Create coach-trainee relationship
    await CoachTrainee.create({
      coachId: coach._id,
      traineeId: trainee._id
    });

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

  it.only("should handle the complete flow from coach-trainee relationship to workout completion", async () => {
    // 1. Coach creates an exercise with KPIs
    const exerciseData = {
      title: 'Squat Exercise',
      description: 'Basic squat movement pattern',
      media: ['https://example.com/squat.mp4'],
      kpis: [{
        goalValue: 10,
        unit: 'repetitions',
        performanceGoal: 'maximize'
      }]
    };

    const exerciseResponse = await request(app)
      .post('/exercise/exercise')
      .set('Authorization', `Bearer ${coachToken}`)
      .send(exerciseData);

    expect(exerciseResponse.status).toBe(201);
    const exerciseId = exerciseResponse.body.data.payload.exercise._id;

    // 2. Coach creates a template with the exercise
    const templateData = {
      title: 'Lower Body Workout',
      description: 'Basic lower body training template',
      exerciseIds: [exerciseId]
    };

    const templateResponse = await request(app)
      .post('/exercise/template')
      .set('Authorization', `Bearer ${coachToken}`)
      .send(templateData);

    expect(templateResponse.status).toBe(201);
    const templateId = templateResponse.body.data.payload.template._id;

    // 3. Coach shares template with trainee
    const shareData = {
      resourceType: ResourceType.TEMPLATE,
      resourceId: templateId,
      sharedWithId: trainee._id
    };

    const shareResponse = await request(app)
      .post('/exercise/share')
      .set('Authorization', `Bearer ${coachToken}`)
      .send(shareData);

    expect(shareResponse.status).toBe(201);

    // 4. Trainee creates a workout from the shared template
    const workoutData = {
      templateId,
      startTimestamp: new Date(),
      name: 'Test Workout',
      notes: 'First workout with template'
    };

    const workoutResponse = await request(app)
      .post('/workout/workout')
      .set('Authorization', `Bearer ${traineeToken}`)
      .send(workoutData);

    expect(workoutResponse.status).toBe(201);
    const workoutId = workoutResponse.body.data.payload.workout._id;

    // 5. Get exercise logs for the workout
    const workoutDetailsResponse = await request(app)
      .get(`/workout/workout/${workoutId}`)
      .set('Authorization', `Bearer ${traineeToken}`);

    expect(workoutDetailsResponse.status).toBe(200);
    const exerciseLog = workoutDetailsResponse.body.data.payload.workout.exerciseLogs[0];

    // 6. Trainee logs KPI values and completes the workout
    const logUpdateData = {
      actualValue: 12,
      duration: 300,
      status: ExerciseLogStatus.COMPLETED
    };

    const logUpdateResponse = await request(app)
      .put(`/workout/log/${exerciseLog._id}`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send(logUpdateData);

    expect(logUpdateResponse.status).toBe(200);

    // Update workout status to completed
    const workoutUpdateResponse = await request(app)
      .put(`/workout/workout/${workoutId}`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({
        status: WorkoutStatus.COMPLETED,
        endTimestamp: new Date()
      });

    expect(workoutUpdateResponse.status).toBe(200);
    // console.log(workoutUpdateResponse.body.data.payload.workout);

    // 7. Coach fetches all trainee workouts
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    const endDate = new Date();

    const coachWorkoutsResponse = await request(app)
      .get('/workout/workouts/completed')
      .set('Authorization', `Bearer ${coachToken}`);

    expect(coachWorkoutsResponse.status).toBe(200);
    expect(coachWorkoutsResponse.body.data.payload.workouts).toHaveLength(1);
    expect(coachWorkoutsResponse.body.data.payload.workouts[0]).toMatchObject({
      _id: workoutId,
      traineeId: trainee._id.toString(),
      status: WorkoutStatus.COMPLETED,
      traineeName: trainee.name,
      traineeEmail: trainee.email
    });

    // 8. Trainee fetches their own workouts
    const traineeWorkoutsResponse = await request(app)
      .get('/workout/workouts')
      .query({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .set('Authorization', `Bearer ${traineeToken}`);

    expect(traineeWorkoutsResponse.status).toBe(200);
    expect(traineeWorkoutsResponse.body.data.payload.workouts).toHaveLength(1);
    expect(traineeWorkoutsResponse.body.data.payload.workouts[0]).toMatchObject({
      _id: workoutId,
      traineeId: trainee._id.toString(),
      status: WorkoutStatus.COMPLETED
    });
  });
}); 