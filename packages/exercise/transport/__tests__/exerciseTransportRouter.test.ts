import { InMemoryTransport } from '../../../shared/transport/inMemoryTransport';
import { ExerciseTransportRouter } from '../exerciseTransportRouter';
import { ExerciseService } from '../../services/exerciseService';
import { ResourceType } from '../../types';
import { DomainError } from '../../../shared/errors/DomainError';
import { Document } from 'mongoose';
import { IExercise } from '../../models/Exercise';
import { ITrainingTemplate } from '../../models/TrainingTemplate';
import { ISharedResource } from '../../models/SharedResource';
import { IKPI } from '../../models/KPI';

// Mock ExerciseService
const mockExerciseService = {
  createExerciseWithKPIs: jest.fn(),
  createTemplate: jest.fn(),
  shareResource: jest.fn(),
  updateExercise: jest.fn(),
  updateKpi: jest.fn(),
  updateTemplate: jest.fn(),
  deleteSharedResource: jest.fn(),
  updateExerciseWithKPIs: jest.fn()
} as unknown as ExerciseService;

describe('ExerciseTransportRouter', () => {
  let transport: InMemoryTransport;
  let exerciseTransportRouter: ExerciseTransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    exerciseTransportRouter = new ExerciseTransportRouter(transport, mockExerciseService);
    await exerciseTransportRouter.listen();
  });

  afterEach(async () => {
    await exerciseTransportRouter.close();
    await transport.disconnect();
    jest.clearAllMocks();
  });

  describe('exercise.create', () => {
    it('should handle exercise creation requests', async () => {
      const exerciseData = {
        title: 'Test Exercise',
        description: 'Test Description',
        media: ['https://example.com/test.mp4'],
        userId: 'user123'
      };

      const expectedResponse = {
        exercise: {
          _id: 'exercise123',
          title: exerciseData.title,
          description: exerciseData.description,
          media: exerciseData.media
        }
      };

      jest.spyOn(mockExerciseService, 'createExerciseWithKPIs').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exercise.create',
        {
          type: 'CREATE_EXERCISE',
          payload: exerciseData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockExerciseService.createExerciseWithKPIs).toHaveBeenCalledWith(exerciseData);
    });

    it('should handle exercise creation errors', async () => {
      const exerciseData = {
        title: '',  // Invalid title
        description: '',
        media: [],
        userId: 'user123'
      };

      jest.spyOn(mockExerciseService, 'createExerciseWithKPIs').mockRejectedValue(
        new DomainError('Invalid exercise data')
      );

      const error: any = await transport.request(
        'exercise.create',
        {
          type: 'CREATE_EXERCISE',
          payload: exerciseData
        }
      );

      expect(error.message).toBe('Invalid exercise data');
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('template.create', () => {
    it('should handle template creation requests', async () => {
      const templateData = {
        title: 'Test Template',
        description: 'Test Description',
        exerciseIds: ['exercise123'],
        userId: 'user123'
      };

      const expectedResponse = {
        template: {
          _id: 'template123',
          title: templateData.title,
          description: templateData.description,
          exercises: templateData.exerciseIds
        }
      };

      jest.spyOn(mockExerciseService, 'createTemplate').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'template.create',
        {
          type: 'CREATE_TEMPLATE',
          payload: templateData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockExerciseService.createTemplate).toHaveBeenCalledWith(templateData);
    });
  });

  describe('resource.share', () => {
    it('should handle resource sharing requests', async () => {
      const shareData = {
        resourceType: ResourceType.EXERCISE,
        resourceId: 'exercise123',
        sharedWithId: 'user456',
        userId: 'user123'
      };

      const expectedResponse = {
        sharedResource: {
          _id: 'shared123',
          resourceType: shareData.resourceType,
          resourceId: shareData.resourceId,
          sharedWithId: shareData.sharedWithId,
          sharedById: shareData.userId
        }
      };

      jest.spyOn(mockExerciseService, 'shareResource').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'resource.share',
        {
          type: 'SHARE_RESOURCE',
          payload: shareData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockExerciseService.shareResource).toHaveBeenCalledWith(shareData);
    });
  });

  describe('exercise.update', () => {
    it('should handle exercise update requests', async () => {
      const updateData = {
        id: 'exercise123',
        title: 'Updated Exercise',
        description: 'Updated Description',
        userId: 'user123',
      };

      const expectedResponse = {
        exercise: {
          _id: updateData.id,
          title: updateData.title,
          description: updateData.description,
          __v: 0
        }
      };

      const mockExercise = {
        _id: updateData.id,
        title: updateData.title,
        description: updateData.description,
        __v: 0
      } as any;

      jest.spyOn(mockExerciseService, 'updateExercise').mockResolvedValue({ exercise: mockExercise });

      const response = await transport.request(
        'exercise.update',
        {
          type: 'UPDATE_EXERCISE',
          payload: updateData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        updateData.id,
        { title: updateData.title, description: updateData.description, userId: updateData.userId }
      );
    });
  });

  describe('resource.delete', () => {
    it('should handle resource deletion requests', async () => {
      const deleteData = {
        id: 'shared123',
        userId: 'user123'
      };

      jest.spyOn(mockExerciseService, 'deleteSharedResource').mockResolvedValue(true);

      const response = await transport.request(
        'resource.delete',
        {
          type: 'DELETE_RESOURCE',
          payload: deleteData
        }
      );

      expect(response).toBe(true);
      expect(mockExerciseService.deleteSharedResource).toHaveBeenCalledWith(
        deleteData.id,
        deleteData.userId
      );
    });
  });

  describe('exercise.updateWithKPIs', () => {
    it('should handle exercise update with KPIs requests', async () => {
      const updateData = {
        id: 'exercise123',
        title: 'Updated Exercise',
        description: 'Updated Description',
        userId: 'user123',
        kpis: [
          {
            _id: 'kpi123',
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

      const expectedResponse = {
        exercise: {
          _id: updateData.id,
          title: updateData.title,
          description: updateData.description,
          __v: 0
        }
      };

      const mockExercise = {
        _id: updateData.id,
        title: updateData.title,
        description: updateData.description,
        __v: 0
      } as any;

      jest.spyOn(mockExerciseService, 'updateExerciseWithKPIs')
        .mockResolvedValue({ exercise: mockExercise });

      const response = await transport.request(
        'exercise.updateWithKPIs',
        {
          type: 'UPDATE_EXERCISE_WITH_KPIS',
          payload: updateData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockExerciseService.updateExerciseWithKPIs).toHaveBeenCalledWith(
        updateData.id,
        {
          title: updateData.title,
          description: updateData.description,
          userId: updateData.userId,
          kpis: updateData.kpis
        }
      );
    });

    it('should handle validation errors', async () => {
      const updateData = {
        id: 'exercise123',
        title: '', // Invalid title
        userId: 'user123',
        kpis: [
          {
            goalValue: -5, // Invalid negative value
            unit: '',     // Missing unit
            performanceGoal: 'invalid' // Invalid performance goal
          }
        ]
      };

      jest.spyOn(mockExerciseService, 'updateExerciseWithKPIs')
        .mockRejectedValue(new DomainError('Validation failed'));

      const error: any = await transport.request(
        'exercise.updateWithKPIs',
        {
          type: 'UPDATE_EXERCISE_WITH_KPIS',
          payload: updateData
        }
      );

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
});
