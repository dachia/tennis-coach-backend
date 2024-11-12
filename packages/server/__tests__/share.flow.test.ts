import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Exercise } from '../../exercise/models/Exercise';
import { SharedResource } from '../../exercise/models/SharedResource';
import { ResourceType } from "../../shared/constants/PerformanceGoal";
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import jwt from 'jsonwebtoken';
import { ShareDTO } from '../../exercise/types';

describe("Share Flow", () => {
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

  describe("Complete Share Flow", () => {
    it("should handle the complete flow of sharing and managing shared resources", async () => {
      // 1. Create an exercise as a coach
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
      // Fetch all exercise shares (initially empty)
      const initialSharesResponse = await request(app)
        .get(`/exercise/shares/${exerciseId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(initialSharesResponse.status).toBe(200);
      expect(initialSharesResponse.body.data.payload.shares).toEqual([]);

      // 2. Share the exercise with trainee
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
      const sharedResourceId = shareResponse.body.data.payload.share._id;

      // 3. Verify shared resource was created correctly
      const sharedResource = await SharedResource.findById(sharedResourceId);
      expect(sharedResource).toBeTruthy();
      expect(sharedResource?.resourceId.toString()).toBe(exerciseId);
      expect(sharedResource?.sharedWithId.toString()).toBe(trainee._id.toString());
      expect(sharedResource?.sharedById.toString()).toBe(coach._id.toString());

      // Verify shares are returned correctly
      const sharesResponse = await request(app)
        .get(`/exercise/shares/${exerciseId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(sharesResponse.status).toBe(200);
      expect(sharesResponse.body).toMatchObject({
        status: 'success',
        data: {
          message: 'Resource shares retrieved successfully',
          payload: {
            shares: [{
              email: trainee.email,
              name: trainee.name,
              sharedAt: expect.any(String)
            }]
          }
        },
        error: null,
        version: expect.any(Number)
      });
      // Verify trainee can see the shared exercise
      const traineeExercisesResponse = await request(app)
        .get('/exercise/exercises')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(traineeExercisesResponse.status).toBe(200);
      expect(traineeExercisesResponse.body.data.payload.exercises).toHaveLength(1);
      expect(traineeExercisesResponse.body.data.payload.exercises[0].isShared).toBe(true);
      
      // Type check the response
      const shares: ShareDTO[] = sharesResponse.body.data.payload.shares;
      expect(shares).toHaveLength(1);
      expect(new Date(shares[0].sharedAt)).toBeInstanceOf(Date);

      // 4. Delete the shared resource as coach
      const deleteResponse = await request(app)
        .delete(`/exercise/share/${sharedResourceId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(deleteResponse.status).toBe(200);

      // 5. Verify shared resource was deleted
      const deletedResource = await SharedResource.findById(sharedResourceId);
      expect(deletedResource).toBeNull();

      // 6. Attempt to share non-existent exercise
      const invalidShareData = {
        resourceType: ResourceType.EXERCISE,
        resourceId: new mongoose.Types.ObjectId(),
        sharedWithId: trainee._id
      };

      const invalidShareResponse = await request(app)
        .post('/exercise/share')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(invalidShareData);

      expect(invalidShareResponse.status).toBe(404);

      // 7. Attempt to delete non-existent shared resource
      const invalidDeleteResponse = await request(app)
        .delete(`/exercise/share/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(invalidDeleteResponse.status).toBe(404);
    });
  });
});
