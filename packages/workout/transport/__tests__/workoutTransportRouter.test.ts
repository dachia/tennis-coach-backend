import { InMemoryTransport } from '../../../shared/transport/inMemoryTransport';
import { WorkoutTransportRouter } from '../workoutTransportRouter';
import { WorkoutService } from '../../services/workoutService';
import { WorkoutStatus, ExerciseLogStatus } from '../../types';
import { DomainError } from '../../../shared/errors/DomainError';

const mockWorkoutService = {
  createWorkout: jest.fn(),
  createExerciseLog: jest.fn(),
  updateWorkout: jest.fn(),
  updateExerciseLog: jest.fn(),
  getExerciseLogById: jest.fn(),
  getExerciseLogsByDateRange: jest.fn()
} as unknown as WorkoutService;

describe('WorkoutTransportRouter', () => {
  let transport: InMemoryTransport;
  let workoutTransportRouter: WorkoutTransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    workoutTransportRouter = new WorkoutTransportRouter(transport, mockWorkoutService);
    await workoutTransportRouter.listen();
  });

  afterEach(async () => {
    await workoutTransportRouter.close();
    await transport.disconnect();
    jest.clearAllMocks();
  });

  describe('workout.create', () => {
    it('should handle workout creation requests', async () => {
      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date(),
        templateId: 'template123',
        userId: 'user123'
      };

      const expectedResponse = {
        workout: {
          _id: 'workout123',
          ...workoutData,
          status: WorkoutStatus.PLANNED
        }
      };

      jest.spyOn(mockWorkoutService, 'createWorkout').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'workout.create',
        {
          type: 'CREATE_WORKOUT',
          payload: workoutData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(workoutData);
    });
  });

  describe('exerciseLog.create', () => {
    it('should handle exercise log creation requests', async () => {
      const logData = {
        workoutId: 'workout123',
        exerciseId: 'exercise123',
        actualValue: 100,
        duration: 300,
        userId: 'user123'
      };

      const expectedResponse = {
        exerciseLog: {
          _id: 'log123',
          ...logData,
          status: ExerciseLogStatus.COMPLETED
        }
      };

      jest.spyOn(mockWorkoutService, 'createExerciseLog').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exerciseLog.create',
        {
          type: 'CREATE_EXERCISE_LOG',
          payload: logData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockWorkoutService.createExerciseLog).toHaveBeenCalledWith(logData);
    });
  });

  describe('workout.update', () => {
    it('should handle workout update requests', async () => {
      const updateData = {
        id: 'workout123',
        status: WorkoutStatus.COMPLETED,
        notes: 'Updated notes',
        userId: 'user123'
      };

      const expectedResponse = {
        workout: {
          _id: updateData.id,
          status: updateData.status,
          notes: updateData.notes,
          __v: 0
        }
      };

      const mockWorkout = {
        _id: updateData.id,
        status: updateData.status,
        notes: updateData.notes,
        __v: 0
      };

      jest.spyOn(mockWorkoutService, 'updateWorkout').mockResolvedValue({ workout: mockWorkout } as any);

      const response = await transport.request(
        'workout.update',
        {
          type: 'UPDATE_WORKOUT',
          payload: updateData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockWorkoutService.updateWorkout).toHaveBeenCalledWith(
        updateData.id,
        { status: updateData.status, notes: updateData.notes, userId: updateData.userId }
      );
    });
  });

  describe('exerciseLog.update', () => {
    it('should handle exercise log update requests', async () => {
      const updateData = {
        id: 'log123',
        actualValue: 150,
        status: ExerciseLogStatus.COMPLETED,
        userId: 'user123'
      };

      const expectedResponse = {
        exerciseLog: {
          _id: updateData.id,
          actualValue: updateData.actualValue,
          status: updateData.status,
          __v: 0
        }
      };

      jest.spyOn(mockWorkoutService, 'updateExerciseLog').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exerciseLog.update',
        {
          type: 'UPDATE_EXERCISE_LOG',
          payload: updateData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockWorkoutService.updateExerciseLog).toHaveBeenCalledWith(
        updateData.id,
        { actualValue: updateData.actualValue, status: updateData.status, userId: updateData.userId }
      );
    });
  });

  describe('exerciseLog.get', () => {
    it('should handle exercise log fetch requests', async () => {
      const fetchData = {
        id: 'log123',
        userId: 'user123'
      };

      const expectedResponse = {
        exerciseLog: {
          _id: fetchData.id,
          workoutId: 'workout123',
          exerciseId: 'exercise123',
          actualValue: 100,
          duration: 300,
          status: ExerciseLogStatus.COMPLETED
        }
      };

      jest.spyOn(mockWorkoutService, 'getExerciseLogById').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exerciseLog.get',
        {
          type: 'GET_EXERCISE_LOG',
          payload: fetchData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockWorkoutService.getExerciseLogById).toHaveBeenCalledWith(
        fetchData.id,
        fetchData.userId
      );
    });
  });

  describe('exerciseLog.getByDateRange', () => {
    it('should handle exercise log fetch by date range requests', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const fetchData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId: 'user123',
        kpiId: 'kpi123'
      };

      const expectedResponse = {
        exerciseLogs: [
          {
            _id: 'log123',
            workoutId: 'workout123',
            exerciseId: 'exercise123',
            kpiId: 'kpi123',
            actualValue: 100,
            duration: 300,
            logDate: startDate,
            status: ExerciseLogStatus.COMPLETED
          }
        ]
      };

      jest.spyOn(mockWorkoutService, 'getExerciseLogsByDateRange')
        .mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exerciseLog.getByDateRange',
        {
          type: 'GET_EXERCISE_LOGS_BY_DATE_RANGE',
          payload: fetchData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockWorkoutService.getExerciseLogsByDateRange)
        .toHaveBeenCalledWith({
          startDate: new Date(fetchData.startDate),
          endDate: new Date(fetchData.endDate),
          userId: fetchData.userId,
          kpiId: fetchData.kpiId
        });
    });
  });
}); 