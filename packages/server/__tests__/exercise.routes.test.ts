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
import { Exercise } from '../../exercise/models/Exercise';
import { TrainingTemplate } from '../../exercise/models/TrainingTemplate';
import { SharedResource } from '../../exercise/models/SharedResource';
import { ResourceType } from '../../exercise/types';
import { KPI } from '../../exercise/models/KPI';

describe('Exercise Routes', () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coach: any;
  let trainee: any;
  let coachToken: string;
  let traineeToken: string;

  beforeAll(async () => {
    // Setup test database
    const { uri, closeDatabase: closeDatabaseFn } = await setupTestDatabase();
    closeDatabase = closeDatabaseFn;

    // Connect to test database
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
    // Clear database collections before each test
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

  describe('POST /exercise/exercise', () => {
    it('should create a new exercise successfully', async () => {
      const exerciseData = {
        title: 'Forehand Practice',
        description: 'Practice forehand strokes',
        media: [
          'https://storage.googleapis.com/bucket-name/video1.mp4',
          'https://storage.googleapis.com/bucket-name/image1.jpg'
        ],
        kpis: [
          {
            goalValue: 10,
            unit: 'repetitions',
            performanceGoal: 'maximize'
          }
        ]
      };

      const response = await request(app)
        .post('/exercise/exercise')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(exerciseData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            exercise: expect.objectContaining({
              title: exerciseData.title,
              description: exerciseData.description,
              media: exerciseData.media,
              kpis: expect.arrayContaining([
                expect.objectContaining({
                  goalValue: exerciseData.kpis[0].goalValue,
                  unit: exerciseData.kpis[0].unit,
                  performanceGoal: exerciseData.kpis[0].performanceGoal
                })
              ])
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return 400 for invalid exercise data', async () => {
      const invalidData = {
        title: '',
        description: '',
        media: 'not-an-array'
      };

      const response = await request(app)
        .post('/exercise/exercise')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: expect.any(String)
        },
        version: expect.any(Number)
      });
    });
  });

  describe('POST /exercise/template', () => {
    let exercise: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });
    });

    it('should create a new template successfully', async () => {
      const templateData = {
        title: 'Beginner Workout',
        description: 'Template for beginners',
        exerciseIds: [exercise._id]
      };

      const response = await request(app)
        .post('/exercise/template')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            template: expect.objectContaining({
              title: templateData.title,
              description: templateData.description
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });
  });

  describe('POST /exercise/share', () => {
    let exercise: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });
    });

    it('should share a resource successfully', async () => {
      const shareData = {
        resourceType: ResourceType.EXERCISE,
        resourceId: exercise._id,
        sharedWithId: trainee._id
      };

      const response = await request(app)
        .post('/exercise/share')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(shareData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            sharedResource: expect.objectContaining({
              resourceType: shareData.resourceType,
              resourceId: exercise._id.toString(),
              sharedWithId: trainee._id.toString(),
              sharedById: coach._id.toString()
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return 404 when sharing non-existent resource', async () => {
      const shareData = {
        resourceType: ResourceType.EXERCISE,
        resourceId: new mongoose.Types.ObjectId(),
        sharedWithId: trainee._id
      };

      const response = await request(app)
        .post('/exercise/share')
        .set('Authorization', `Bearer ${coachToken}`)
        .send(shareData);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: expect.any(String)
        },
        version: expect.any(Number)
      });
    });
  });

  describe('PUT /exercise/exercise/:id', () => {
    let exercise: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });
    });

    it('should update an exercise successfully', async () => {
      const updateData = {
        title: 'Updated Exercise',
        description: 'Updated Description',
        media: ['https://storage.googleapis.com/bucket-name/updated.mp4']
      };

      const response = await request(app)
        .put(`/exercise/exercise/${exercise._id}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            exercise: expect.objectContaining({
              title: updateData.title,
              description: updateData.description,
              media: updateData.media
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return 404 when updating non-existent exercise', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Updated Exercise',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/exercise/exercise/${nonExistentId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /exercise/kpi/:id', () => {
    let exercise: any;
    let kpi: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });

      kpi = await KPI.create({
        exerciseId: exercise._id,
        goalValue: 10,
        unit: 'repetitions',
        performanceGoal: 'maximize'
      });
    });

    it('should update a KPI successfully', async () => {
      const updateData = {
        goalValue: 15,
        unit: 'minutes',
        performanceGoal: 'minimize'
      };

      const response = await request(app)
        .put(`/exercise/kpi/${kpi._id}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            kpi: expect.objectContaining({
              goalValue: updateData.goalValue,
              unit: updateData.unit,
              performanceGoal: updateData.performanceGoal
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });
  });

  describe('PUT /exercise/template/:id', () => {
    let template: any;
    let exercise: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });

      template = await TrainingTemplate.create({
        title: 'Test Template',
        description: 'Test Description',
        exercises: [exercise._id],
        createdBy: coach._id
      });
    });

    it('should update a template successfully', async () => {
      const updateData = {
        title: 'Updated Template',
        description: 'Updated Description',
        exerciseIds: [exercise._id]
      };

      const response = await request(app)
        .put(`/exercise/template/${template._id}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            template: expect.objectContaining({
              title: updateData.title,
              description: updateData.description
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });
  });

  describe('DELETE /exercise/share/:id', () => {
    let exercise: any;
    let sharedResource: any;

    beforeEach(async () => {
      // Create test exercise
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });

      // Create test shared resource
      sharedResource = await SharedResource.create({
        resourceType: ResourceType.EXERCISE,
        resourceId: exercise._id,
        sharedWithId: trainee._id,
        sharedById: coach._id
      });
    });

    it('should delete a shared resource successfully as the sharer', async () => {
      const response = await request(app)
        .delete(`/exercise/share/${sharedResource._id}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: 'Shared resource deleted successfully'
        },
        error: null,
        version: expect.any(Number)
      });

      // Verify the resource was actually deleted
      const deletedResource = await SharedResource.findById(sharedResource._id);
      expect(deletedResource).toBeNull();
    });

    it('should delete a shared resource successfully as the receiver', async () => {
      const response = await request(app)
        .delete(`/exercise/share/${sharedResource._id}`)
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 when deleting non-existent shared resource', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/exercise/share/${nonExistentId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: 'Shared resource not found'
        },
        version: expect.any(Number)
      });
    });

    it('should return 403 when unauthorized user tries to delete', async () => {
      // Create another coach
      const anotherCoach = await User.create({
        email: 'another.coach@example.com',
        password: 'password123',
        name: 'Another Coach',
        role: UserRole.COACH
      });
      const anotherCoachToken = jwt.sign(
        { sub: anotherCoach._id, role: anotherCoach.role },
        testConfig.jwtSecret
      );

      const response = await request(app)
        .delete(`/exercise/share/${sharedResource._id}`)
        .set('Authorization', `Bearer ${anotherCoachToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: 'Unauthorized to delete this shared resource'
        },
        version: expect.any(Number)
      });
    });
  });

  describe('PUT /exercise/exercise/:id/with-kpis', () => {
    let exercise: any;
    let kpi: any;

    beforeEach(async () => {
      exercise = await Exercise.create({
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://storage.googleapis.com/bucket-name/test.mp4'],
        createdBy: coach._id
      });

      kpi = await KPI.create({
        exerciseId: exercise._id,
        goalValue: 10,
        unit: 'repetitions',
        performanceGoal: 'maximize'
      });
    });

    it('should update exercise with KPIs successfully', async () => {
      const updateData = {
        title: 'Updated Exercise',
        description: 'Updated Description',
        media: ['https://storage.googleapis.com/bucket-name/updated.mp4'],
        kpis: [
          {
            _id: kpi._id.toString(),
            goalValue: 15,
            unit: 'minutes',
            performanceGoal: 'minimize'
          },
          {
            goalValue: 20,
            unit: 'repetitions',
            performanceGoal: 'maximize'
          }
        ]
      };

      const response = await request(app)
        .put(`/exercise/exercise/${exercise._id}/with-kpis`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            exercise: expect.objectContaining({
              title: updateData.title,
              description: updateData.description,
              media: updateData.media
            })
          }
        },
        error: null,
        version: expect.any(Number)
      });

      // Verify KPIs were updated
      const updatedKpis = await KPI.find({ exerciseId: exercise._id });
      expect(updatedKpis).toHaveLength(2);
      
      // Verify existing KPI was updated
      const updatedExistingKpi = updatedKpis.find(k => k._id.toString() === kpi._id.toString());
      expect(updatedExistingKpi).toMatchObject({
        goalValue: updateData.kpis[0].goalValue,
        unit: updateData.kpis[0].unit,
        performanceGoal: updateData.kpis[0].performanceGoal
      });

      // Verify new KPI was created
      const newKpi = updatedKpis.find(k => k._id.toString() !== kpi._id.toString());
      expect(newKpi).toMatchObject({
        goalValue: updateData.kpis[1].goalValue,
        unit: updateData.kpis[1].unit,
        performanceGoal: updateData.kpis[1].performanceGoal
      });
    });

    it('should return 404 when updating non-existent exercise', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Updated Exercise',
        description: 'Updated Description',
        kpis: []
      };

      const response = await request(app)
        .put(`/exercise/exercise/${nonExistentId}/with-kpis`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: 'Exercise not found or unauthorized'
        },
        version: expect.any(Number)
      });
    });

    it('should return 400 for invalid KPI data', async () => {
      const updateData = {
        title: 'Updated Exercise',
        kpis: [
          {
            _id: kpi._id.toString(),
            goalValue: -1, // Invalid negative value
            unit: '', // Missing unit
            performanceGoal: 'invalid' // Invalid performance goal
          }
        ]
      };

      const response = await request(app)
        .put(`/exercise/exercise/${exercise._id}/with-kpis`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.error.message).toBeTruthy();
    });
  });

  describe('GET /exercise/exercises', () => {
    let exercises: any[];
    let kpis: any[];

    beforeEach(async () => {
      // Create test exercises
      exercises = await Promise.all([
        Exercise.create({
          title: 'Exercise 1',
          description: 'Description 1',
          media: ['https://example.com/1.mp4'],
          createdBy: coach._id
        }),
        Exercise.create({
          title: 'Exercise 2',
          description: 'Description 2',
          media: ['https://example.com/2.mp4'],
          createdBy: coach._id
        })
      ]);

      // Create KPIs for exercises
      kpis = await Promise.all([
        KPI.create({
          exerciseId: exercises[0]._id,
          goalValue: 10,
          unit: 'repetitions',
          performanceGoal: 'maximize'
        }),
        KPI.create({
          exerciseId: exercises[1]._id,
          goalValue: 15,
          unit: 'minutes',
          performanceGoal: 'minimize'
        })
      ]);
    });

    it('should fetch all exercises with KPIs for the authenticated user', async () => {
      const response = await request(app)
        .get('/exercise/exercises')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            exercises: expect.arrayContaining([
              expect.objectContaining({
                _id: exercises[0]._id.toString(),
                title: exercises[0].title,
                kpis: expect.arrayContaining([
                  expect.objectContaining({
                    _id: kpis[0]._id.toString(),
                    goalValue: kpis[0].goalValue
                  })
                ])
              }),
              expect.objectContaining({
                _id: exercises[1]._id.toString(),
                title: exercises[1].title,
                kpis: expect.arrayContaining([
                  expect.objectContaining({
                    _id: kpis[1]._id.toString(),
                    goalValue: kpis[1].goalValue
                  })
                ])
              })
            ])
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return empty array when user has no exercises', async () => {
      const response = await request(app)
        .get('/exercise/exercises')
        .set('Authorization', `Bearer ${traineeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.payload.exercises).toHaveLength(0);
    });
  });
}); 