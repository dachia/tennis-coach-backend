import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from "../../shared/constants/UserRole";
import mongoose from 'mongoose';
import { bootstrapServer } from '../server';
import { testConfig } from '../config';
import { createTestContainer } from '../di';
import jwt from 'jsonwebtoken';
import { User } from '../../auth/models/User';
import { Plan } from '../../planning/models/Plan';
import { ScheduledPlan } from '../../planning/models/ScheduledPlan';
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { SharedResource } from '../../exercise/models/SharedResource';
import { ResourceType } from '../../shared/constants/PerformanceGoal';
import { CoachTrainee } from '../../auth/models/CoachTrainee';
import { RecurrenceType, WeekDay } from '../../shared/types';

describe('Planning Routes', () => {
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

  describe('POST /planning/plan', () => {
    let template: any;
    let exercise: any;

    beforeEach(async () => {
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

      await SharedResource.create({
        resourceId: template._id,
        resourceType: ResourceType.TEMPLATE,
        sharedById: coach._id,
        sharedWithId: trainee._id
      });
      
      await SharedResource.create({
        resourceId: exercise._id,
        resourceType: ResourceType.EXERCISE,
        sharedById: coach._id,
        sharedWithId: trainee._id
      });
    });

    it('should create a new plan successfully', async () => {
      const planData = {
        title: 'Test Plan',
        description: 'Test Description',
        templateId: template._id,
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: ["monday", "wednesday", "friday"], // Mon, Wed, Fri
        startDate: new Date().toISOString(),
        endDate: ""
        // endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week later
      };

      const response = await request(app)
        .post('/planning/plan')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ ...planData, traineeId: trainee._id });

      expect(response.status).toBe(201);
      expect(response.body.data.payload.plan).toMatchObject({
        templateId: template._id.toString(),
        traineeId: trainee._id.toString(),
        // coachId: coach._id.toString(),
        recurrenceType: planData.recurrenceType
      });
    });

    it('should allow trainee to create their own plan', async () => {
      const planData = {
        exerciseId: exercise._id,
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: ["tuesday", "thursday"], // Tue, Thu
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/planning/plan')
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(planData);
      console.log('response', response.body);
      expect(response.status).toBe(201);
      expect(response.body.data.payload.plan).toMatchObject({
        traineeId: trainee._id.toString(),
        // coachId: undefined,
        exerciseId: exercise._id.toString()
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: 'Invalid Plan'
        // Missing required fields
      };

      const response = await request(app)
        .post('/planning/plan')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    });

    it('should prevent creating plan for unauthorized trainee', async () => {
      const unauthorizedTrainee = await User.create({
        email: 'unauthorized@example.com',
        password: 'password123',
        name: 'Unauthorized Trainee',
        role: UserRole.TRAINEE
      });

      const planData = {
        templateId: template._id,
        traineeId: unauthorizedTrainee._id,
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: ["monday", "wednesday", "friday"],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/planning/plan')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(planData);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Not authorized to create plan for this trainee');
    });
  });

  describe('PUT /planning/plan/:id', () => {
    let plan: any;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Test Plan',
        traineeId: trainee._id,
        coachId: coach._id,
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: ["monday", "wednesday", "friday"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        traineeName: trainee.name,
        traineeEmail: trainee.email
      });
    });

    it('should allow coach to update plan', async () => {
      const updateData = {
        weekDays: ["tuesday", "thursday", "saturday"]
      };

      const response = await request(app)
        .put(`/planning/plan/${plan._id}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plan).toMatchObject({
        weekDays: updateData.weekDays
      });
    });

    it('should allow trainee to update their plan', async () => {
      const updateData = {
        weekDays: ["tuesday", "thursday", "saturday"]
      };

      const response = await request(app)
        .put(`/planning/plan/${plan._id}`)
        .set('Authorization', `Bearer ${traineeToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plan).toMatchObject(updateData);
    });

    it('should prevent unauthorized updates', async () => {
      const unauthorizedTrainee = await User.create({
        email: 'unauthorized@example.com',
        password: 'password123',
        name: 'Unauthorized Trainee',
        role: UserRole.TRAINEE
      });
      const unauthorizedToken = jwt.sign({ sub: unauthorizedTrainee._id, role: unauthorizedTrainee.role }, testConfig.jwtSecret);

      const updateData = {
        weekDays: ["tuesday", "thursday", "saturday"]
      };

      const response = await request(app)
        .put(`/planning/plan/${plan._id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Not authorized to update this plan');
    });
  });

  describe('GET /planning/plans/exercise/:exerciseId', () => {
    let exercise: any;
    let plan: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://example.com/test.mp4'],
        createdBy: coach._id
      });

      plan = await Plan.create({
        name: 'Test Plan',
        traineeId: trainee._id,
        coachId: coach._id,
        exerciseId: exercise._id,
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: ["monday", "wednesday", "friday"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        traineeName: trainee.name,
        traineeEmail: trainee.email
      });
    });

    it('should get plans by exercise id for trainee', async () => {
      const response = await request(app)
        .get(`/planning/plans/exercise/${exercise._id}`)
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plans).toHaveLength(1);
      expect(response.body.data.payload.plans[0]).toMatchObject({
        _id: plan._id.toString(),
        traineeId: trainee._id.toString(),
        exerciseId: exercise._id.toString()
      });
    });

    it('should get plans by exercise id for coach', async () => {
      const response = await request(app)
        .get(`/planning/plans/exercise/${exercise._id}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plans).toHaveLength(1);
      expect(response.body.data.payload.plans[0]).toMatchObject({
        _id: plan._id.toString(),
        traineeId: trainee._id.toString(),
        coachId: coach._id.toString(),
        exerciseId: exercise._id.toString()
      });
    });

    it('should return empty array when no plans found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/planning/plans/exercise/${nonExistentId}`)
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plans).toHaveLength(0);
    });
  });

  describe('GET /planning/plans/today', () => {
    let exercise: any;
    let plan: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://example.com/test.mp4'],
        createdBy: coach._id
      });

      // Create a plan for today
      plan = await Plan.create({
        name: 'Today\'s Plan',
        traineeId: trainee._id,
        coachId: coach._id,
        exerciseId: exercise._id,
        recurrenceType: RecurrenceType.WEEKLY,
        weekDays: [new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as WeekDay],
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        traineeName: trainee.name,
        traineeEmail: trainee.email
      });
      
    });

    it('should get plans for today as trainee', async () => {
      const response = await request(app)
        .get('/planning/plans/today')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plans).toHaveLength(1);
      expect(response.body.data.payload.plans[0]).toMatchObject({
        _id: plan._id.toString(),
        traineeId: trainee._id.toString(),
        exerciseId: exercise._id.toString()
      });
    });

    it('should get plans for today as coach', async () => {
      const response = await request(app)
        .get('/planning/plans/today')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plans).toHaveLength(1);
      expect(response.body.data.payload.plans[0]).toMatchObject({
        _id: plan._id.toString(),
        traineeId: trainee._id.toString(),
        coachId: coach._id.toString(),
        exerciseId: exercise._id.toString()
      });
    });

    it('should return empty array when no plans for today', async () => {
      // Delete existing plan
      await Plan.deleteMany({});
      
      const response = await request(app)
        .get('/planning/plans/today')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.plans).toHaveLength(0);
    });
  });
}); 