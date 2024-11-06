import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';
import jwt from 'jsonwebtoken';

describe("Template Flow", () => {
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

  describe("Complete Template Flow", () => {
    let exerciseId: string;

    beforeEach(async () => {
      // 1. Create exercises to be used in template
      const exerciseData = {
        title: 'Template Exercise',
        description: 'Exercise for template testing',
        media: ['https://example.com/exercise.mp4'],
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

      console.log(exerciseResponse.body);
      exerciseId = exerciseResponse.body.data.payload.exercise._id;
    });

    it("should handle the complete flow of creating, updating, and deleting templates", async () => {

      // 2. Create a template with the exercise
      const templateData = {
        title: 'Workout Template',
        description: 'Template for testing',
        exerciseIds: [exerciseId]
      };

      const templateResponse = await request(app)
        .post('/exercise/template')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(templateData);

      expect(templateResponse.status).toBe(201);
      const templateId = templateResponse.body.data.payload.template._id;

      // 3. Update the template
      const updateData = {
        title: 'Updated Template',
        description: 'Updated description',
        exerciseIds: [exerciseId]
      };

      const updateResponse = await request(app)
        .put(`/exercise/template/${templateId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.payload.template).toMatchObject({
        title: updateData.title,
        description: updateData.description
      });

      // 4. Verify template exists in database
      const template = await TrainingTemplate.findById(templateId);
      expect(template).toBeTruthy();
      expect(template?.title).toBe(updateData.title);
      expect(template?.description).toBe(updateData.description);
      expect(template?.exerciseIds[0].toString()).toBe(exerciseId);

      // 5. Delete the template
      const deleteResponse = await request(app)
        .delete(`/exercise/template/${templateId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(deleteResponse.status).toBe(200);

      // 6. Verify template was deleted
      const deletedTemplate = await TrainingTemplate.findById(templateId);
      expect(deletedTemplate).toBeNull();

      // 7. Verify exercise still exists
      const exercise = await Exercise.findById(exerciseId);
      expect(exercise).toBeTruthy();
    });

    it("should handle invalid template operations", async () => {
      // 1. Try to create template with non-existent exercise
      const invalidTemplateData = {
        title: 'Invalid Template',
        description: 'Template with invalid exercise',
        exerciseIds: [new mongoose.Types.ObjectId()]
      };

      const invalidResponse = await request(app)
        .post('/exercise/template')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(invalidTemplateData);

      expect(invalidResponse.status).toBe(400);

      // 2. Try to update non-existent template
      const updateResponse = await request(app)
        .put(`/exercise/template/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          exerciseIds: [exerciseId]
        });

      console.log(updateResponse.body);
      expect(updateResponse.status).toBe(404);

      // 3. Try to delete non-existent template
      const deleteResponse = await request(app)
        .delete(`/exercise/template/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(deleteResponse.status).toBe(404);
    });
  });
});
