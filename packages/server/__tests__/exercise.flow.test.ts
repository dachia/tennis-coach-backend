import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { SharedResource } from '../../exercise/models/SharedResource';
import { ResourceType } from '../../exercise/types';
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
      // 1. Create an exercise
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

      // 2. Update exercise with new KPIs
      const updateData = {
        title: 'Advanced Squat',
        description: 'Advanced squat movement pattern with proper form',
        kpis: [
          {
            _id: exerciseResponse.body.data.payload.exercise.kpis[0]._id,
            goalValue: 15,
            unit: 'repetitions',
            performanceGoal: 'maximize'
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

      // 3. Create a training template with the exercise
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

      // 4. Share exercise with trainee
      const shareExerciseData = {
        resourceType: ResourceType.EXERCISE,
        resourceId: exerciseId,
        sharedWithId: trainee._id
      };

      const shareExerciseResponse = await request(app)
        .post('/exercise/share')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(shareExerciseData);

      expect(shareExerciseResponse.status).toBe(201);

      // 5. Share template with trainee
      const shareTemplateData = {
        resourceType: ResourceType.TEMPLATE,
        resourceId: templateId,
        sharedWithId: trainee._id
      };

      const shareTemplateResponse = await request(app)
        .post('/exercise/share')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(shareTemplateData);

      expect(shareTemplateResponse.status).toBe(201);

      // 6. Verify shared resources exist
      const sharedResources = await SharedResource.find({
        sharedWithId: trainee._id
      });

      expect(sharedResources).toHaveLength(2);
      expect(sharedResources.map(r => r.resourceType)).toEqual(
        expect.arrayContaining([ResourceType.EXERCISE, ResourceType.TEMPLATE])
      );

      // 7. Remove shared exercise
      const exerciseShareId = sharedResources.find(r => r.resourceType === ResourceType.EXERCISE)!._id;
      const deleteResponse = await request(app)
        .delete(`/exercise/share/${exerciseShareId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(deleteResponse.status).toBe(200);

      // 8. Verify exercise was unshared
      const remainingShares = await SharedResource.find({
        sharedWithId: trainee._id
      });
      expect(remainingShares).toHaveLength(1);
      expect(remainingShares[0].resourceType).toBe(ResourceType.TEMPLATE);
    });
  });
}); 