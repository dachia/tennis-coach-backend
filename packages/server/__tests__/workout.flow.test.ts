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
import { CoachTrainee } from '../../auth/models/CoachTrainee';

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

}); 