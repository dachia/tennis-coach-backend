import { InMemoryTransport } from '../../../shared/transport/inMemoryTransport';
import { ExerciseTransportRouter } from '../exerciseTransportRouter';
import { ExerciseService } from '../../services/exerciseService';
import { ResourceType } from '../../types';
import { DomainError } from '../../../shared/errors/DomainError';
import { ExerciseQueryService } from '../../services/exerciseQueryService';
import { createResponse } from '../../../shared';

// Mock ExerciseService
const mockExerciseService = {
  createExerciseWithKPIs: jest.fn(),
  createTemplate: jest.fn(),
  shareResource: jest.fn(),
  updateExercise: jest.fn(),
  updateKpi: jest.fn(),
  updateTemplate: jest.fn(),
  deleteSharedResource: jest.fn(),
  updateExerciseWithKPIs: jest.fn(),
  deleteExercise: jest.fn(),
  deleteTemplate: jest.fn()
} as unknown as ExerciseService;

const mockExerciseQueryService = {
  getExercisesWithKPIs: jest.fn()
} as unknown as ExerciseQueryService;

describe('ExerciseTransportRouter', () => {
  let transport: InMemoryTransport;
  let exerciseTransportRouter: ExerciseTransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    exerciseTransportRouter = new ExerciseTransportRouter(transport, mockExerciseService, mockExerciseQueryService);
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

      expect(response).toEqual(createResponse('success', 'Exercise created successfully', expectedResponse));
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

      expect(response).toEqual(createResponse('success', 'Template created successfully', expectedResponse));
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

      expect(response).toEqual(createResponse('success', 'Resource shared successfully', expectedResponse));
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

      expect(response).toEqual(createResponse('success', 'Exercise updated successfully', expectedResponse));
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

      expect(response).toEqual(createResponse('success', 'Resource deleted successfully', { success: true }));
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

      expect(response).toEqual(createResponse('success', 'Exercise updated successfully', expectedResponse));
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

  describe('exercises.get', () => {
    it('should handle exercises fetch requests', async () => {
      const fetchData = {
        userId: 'user123'
      };

      const expectedResponse = {
        exercises: [
          {
            _id: 'exercise1',
            title: 'Exercise 1',
            description: 'Description 1',
            kpis: [
              {
                _id: 'kpi1',
                goalValue: 10,
                unit: 'repetitions'
              }
            ]
          }
        ]
      };

      jest.spyOn(mockExerciseQueryService, 'getExercisesWithKPIs')
        .mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exercises.get',
        {
          type: 'GET_EXERCISES',
          payload: fetchData
        }
      );

      expect(response).toEqual(createResponse('success', 'Exercise fetched successfully', expectedResponse));
      expect(mockExerciseQueryService.getExercisesWithKPIs)
        .toHaveBeenCalledWith(fetchData.userId);
    });
  });

  describe('exercise.delete', () => {
    it('should handle exercise deletion requests', async () => {
      const deleteData = {
        id: 'exercise123',
        userId: 'user123'
      };

      jest.spyOn(mockExerciseService, 'deleteExercise')
        .mockResolvedValue(true);

      const response = await transport.request(
        'exercise.delete',
        {
          type: 'DELETE_EXERCISE',
          payload: deleteData
        }
      );

      expect(response).toEqual(createResponse('success', 'Exercise deleted successfully', { success: true }));
      expect(mockExerciseService.deleteExercise)
        .toHaveBeenCalledWith(deleteData.id, deleteData.userId);
    });

    it('should handle exercise deletion errors', async () => {
      const deleteData = {
        id: 'nonexistent123',
        userId: 'user123'
      };

      jest.spyOn(mockExerciseService, 'deleteExercise')
        .mockRejectedValue(new DomainError('Exercise not found', 404));

      const error: any = await transport.request(
        'exercise.delete',
        {
          type: 'DELETE_EXERCISE',
          payload: deleteData
        }
      );

      expect(error.message).toBe('Exercise not found');
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('template.delete', () => {
    it('should handle template deletion requests', async () => {
      const deleteData = {
        id: 'template123',
        userId: 'user123'
      };

      jest.spyOn(mockExerciseService, 'deleteTemplate')
        .mockResolvedValue(true);

      const response = await transport.request(
        'template.delete',
        {
          type: 'DELETE_TEMPLATE',
          payload: deleteData
        }
      );

      expect(response).toEqual(createResponse('success', 'Template deleted successfully', { success: true }));
      expect(mockExerciseService.deleteTemplate).toHaveBeenCalledWith(
        deleteData.id,
        deleteData.userId
      );
    });

    it('should handle template deletion errors', async () => {
      const deleteData = {
        id: 'template123',
        userId: 'user123'
      };

      jest.spyOn(mockExerciseService, 'deleteTemplate')
        .mockRejectedValue(new DomainError('Template not found', 404));

      const error: any = await transport.request(
        'template.delete',
        {
          type: 'DELETE_TEMPLATE',
          payload: deleteData
        }
      );

      expect(error.message).toBe('Template not found');
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
});
