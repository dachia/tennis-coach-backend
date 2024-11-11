import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { SharedResource } from '../../exercise/models/SharedResource';
import { KPIDTO, ResourceType } from '../../exercise/types';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import jwt from 'jsonwebtoken';
import { KPI } from '../../exercise/models/KPI';

describe("Exercise Flow", () => {
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
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  describe("Complete Exercise Flow", () => {
    it("should handle the complete flow of creating and sharing exercises", async () => {
      // 0. Get presigned URL for media upload
      const mediaResponse = await request(app)
        .post('/media/presigned-url')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          fileType: 'video/mp4'
        });

      expect(mediaResponse.status).toBe(200);
      expect(mediaResponse.body.data.payload).toMatchObject({
        uploadUrl: expect.any(String),
        fileUrl: expect.stringMatching(/^https:\/\/.*\.amazonaws\.com\/uploads\/.*\.mp4$/)
      });

      const mediaUrl = mediaResponse.body.data.payload.fileUrl;

      // 1. Create an exercise with uploaded media
      const exerciseData = {
        title: 'Squat Exercise',
        description: 'Basic squat movement pattern',
        media: [mediaUrl],
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
      // Fetch exercises by userId
      const exercisesResponse = await request(app)
        .get('/exercise/exercises')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(exercisesResponse.status).toBe(200);
      expect(exercisesResponse.body.data.payload.exercises).toHaveLength(1);
      expect(exercisesResponse.body.data.payload.exercises[0]._id).toBe(exerciseId);
      const fetchedExercise = exercisesResponse.body.data.payload.exercises[0];

      // 2. Update fetched exercise with new KPIs
      const updateData = {
        ...fetchedExercise,
        title: 'Advanced Squat',
        description: 'Advanced squat movement pattern with proper form',
        kpis: [
          {
            ...fetchedExercise.kpis.find((k: KPIDTO) => k.unit === 'repetitions'),
            goalValue: 15,
          },
          {
            goalValue: 20,
            unit: 'minutes',
            performanceGoal: 'minimize'
          }
        ]
      };

      const updateResponse = await request(app)
        .put(`/exercise/exercise/${exerciseId}/with-kpis`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.payload.exercise.title).toBe(updateData.title);
      // ensure that media is not updated
      expect(updateResponse.body.data.payload.exercise.media).toEqual(fetchedExercise.media);

      // Verify KPIs were updated correctly
      const exerciseWithKpis = await KPI.find({ exerciseId });
      expect(exerciseWithKpis).toHaveLength(2);
      expect(exerciseWithKpis).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            goalValue: 15,
            unit: 'repetitions',
            performanceGoal: 'maximize'
          }),
          expect.objectContaining({
            goalValue: 20,
            unit: 'minutes',
            performanceGoal: 'minimize'
          })
        ])
      );

      // 3. Delete the exercise and verify deletion
      const deleteResponse = await request(app)
        .delete(`/exercise/exercise/${exerciseId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.data.message).toBe('Exercise deleted successfully');

      // Verify exercise was deleted
      const deletedExercise = await Exercise.findById(exerciseId);
      expect(deletedExercise?.isArchived).toBe(true);

      // // Verify KPIs were deleted
      // const deletedKpis = await KPI.find({ exerciseId });
      // expect(deletedKpis).toHaveLength(0);

      // Verify exercise no longer appears in list
      const finalExercisesResponse = await request(app)
        .get('/exercise/exercises')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(finalExercisesResponse.status).toBe(200);
      expect(finalExercisesResponse.body.data.payload.exercises).toHaveLength(0);
    });
  });
}); 