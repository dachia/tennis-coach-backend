import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from "../../shared/constants/UserRole";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../../auth/models/User';
import { CoachTrainee } from '../../auth/models/CoachTrainee';
import { createTestContainer } from '../di';
import { testConfig } from '../config';
import { bootstrapServer } from '../server';

describe("User Flow", () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coachToken: string;
  let traineeTokens: string[] = [];
  const jwtSecret = 'test-secret';

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
    await User.deleteMany({});
    await CoachTrainee.deleteMany({});
    traineeTokens = [];
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  describe("Complete User Flow", () => {
    it("should handle the complete flow of registering users, login, and managing coach-trainee relationships", async () => {
      // 1. Register a coach
      const coachData = {
        email: 'coach@example.com',
        password: 'password123',
        name: 'Coach User',
        role: UserRole.COACH
      };

      const coachRegisterResponse = await request(app)
        .post('/auth/register')
        .send(coachData);

      expect(coachRegisterResponse.status).toBe(201);
      coachToken = coachRegisterResponse.body.data.payload.token;

      // 2. Coach logs in
      const coachLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: coachData.email,
          password: coachData.password
        });

      expect(coachLoginResponse.status).toBe(200);
      expect(coachLoginResponse.body.data.payload.token).toBeTruthy();
      
      // Update token to use the login token
      coachToken = coachLoginResponse.body.data.payload.token;

      // 3. Coach fetches their profile
      const coachProfileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(coachProfileResponse.status).toBe(200);
      expect(coachProfileResponse.body.data.payload.user).toMatchObject({
        email: coachData.email,
        name: coachData.name,
        role: UserRole.COACH
      });

      // 4. Register multiple trainees
      const traineesData = [
        {
          email: 'trainee1@example.com',
          password: 'password123',
          name: 'Trainee One',
          role: UserRole.TRAINEE
        },
        {
          email: 'trainee2@example.com',
          password: 'password123',
          name: 'Trainee Two',
          role: UserRole.TRAINEE
        }
      ];

      for (const traineeData of traineesData) {
        const traineeResponse = await request(app)
          .post('/auth/register')
          .send(traineeData);

        expect(traineeResponse.status).toBe(201);
        traineeTokens.push(traineeResponse.body.data.payload.token);
      }

      // 5. Coach adds trainees
      for (const traineeData of traineesData) {
        const addTraineeResponse = await request(app)
          .post('/auth/coach/trainees')
          .set('Authorization', `Bearer ${coachToken}`)
          .send({ traineeEmail: traineeData.email });

        expect(addTraineeResponse.status).toBe(200);
      }

      // 6. Verify coach can see all trainees
      const getTraineesResponse = await request(app)
        .get('/auth/coach/trainees')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(getTraineesResponse.status).toBe(200);
      expect(getTraineesResponse.body.data.payload.trainees).toHaveLength(2);
      expect(getTraineesResponse.body.data.payload.trainees).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: traineesData[0].email }),
          expect.objectContaining({ email: traineesData[1].email })
        ])
      );

      // 7. Verify each trainee can see their coach
      for (const traineeToken of traineeTokens) {
        const getCoachResponse = await request(app)
          .get('/auth/trainee/coach')
          .set('Authorization', `Bearer ${traineeToken}`);

        expect(getCoachResponse.status).toBe(200);
        expect(getCoachResponse.body.data.payload.coach).toMatchObject({
          email: coachData.email,
          name: coachData.name
        });
      }

      // 8. Coach removes a trainee
      const removeTraineeResponse = await request(app)
        .delete('/auth/coach/trainees')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ traineeEmail: traineesData[0].email });

      expect(removeTraineeResponse.status).toBe(200);

      // 9. Verify updated trainee list
      const finalTraineesResponse = await request(app)
        .get('/auth/coach/trainees')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(finalTraineesResponse.status).toBe(200);
      expect(finalTraineesResponse.body.data.payload.trainees).toHaveLength(1);
      expect(finalTraineesResponse.body.data.payload.trainees[0].email).toBe(traineesData[1].email);
    });
  });
});