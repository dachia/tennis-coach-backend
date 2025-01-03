import { InMemoryTransport } from '../../../shared/transport/inMemoryTransport';
import { WorkoutTransportRouter } from '../workoutTransportRouter';
import { WorkoutService } from '../../services/workoutService';
import { WorkoutStatus, ExerciseLogStatus } from '../../types';
import { WorkoutQueryService } from '../../services/workoutQueryService';
import { createResponse } from '../../../shared';

const mockWorkoutService = {
  createWorkout: jest.fn(),
  createExerciseLog: jest.fn(),
  updateWorkout: jest.fn(),
  updateExerciseLog: jest.fn(),
} as unknown as WorkoutService;

const mockWorkoutQueryService = {
  getExerciseLogById: jest.fn(),
  getExerciseLogsByDateRange: jest.fn()
} as unknown as WorkoutQueryService;

describe('WorkoutTransportRouter', () => {
  let transport: InMemoryTransport;
  let workoutTransportRouter: WorkoutTransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    workoutTransportRouter = new WorkoutTransportRouter(transport, mockWorkoutService, mockWorkoutQueryService);
    await workoutTransportRouter.listen();
  });

  afterEach(async () => {
    await workoutTransportRouter.close();
    await transport.disconnect();
    jest.clearAllMocks();
  });

  describe('workout.create', () => {
    let template: any;
    let exercise: any;
    let kpi: any;

    beforeEach(async () => {
      exercise = {
        _id: 'exercise123',
        title: 'Test Exercise',
        description: 'Test Description',
        kpis: [{
          _id: 'kpi123',
          goalValue: 10,
          unit: 'repetitions',
          performanceGoal: 'maximize'
        }]
      };

      template = {
        _id: 'template123',
        title: 'Test Template',
        description: 'Test Description',
        exercises: [exercise]
      };

      // Mock template fetch response
      jest.spyOn(transport, 'request').mockImplementation((channel, message) => {
        if (channel === 'template.get') {
          return Promise.resolve({ template });
        }
        return Promise.resolve({});
      });
    });

    it.skip('should create workout with exercise logs when template is provided', async () => {
      const workoutData = {
        workoutDate: new Date(),
        startTimestamp: new Date(),
        templateId: 'template123',
        userId: 'user123'
      };

      const expectedWorkout = {
        _id: 'workout123',
        ...workoutData,
        status: WorkoutStatus.PLANNED
      };

      const expectedExerciseLog = {
        _id: 'log123',
        workoutId: expectedWorkout._id,
        exerciseId: exercise._id,
        kpiId: exercise.kpis[0]._id,
        traineeId: workoutData.userId,
        status: ExerciseLogStatus.PENDING
      };

      jest.spyOn(mockWorkoutService, 'createWorkout')
        .mockResolvedValue({ workout: expectedWorkout } as any);

      const response = await transport.request(
        'workout.create',
        {
          type: 'CREATE_WORKOUT',
          payload: workoutData
        }
      );

      expect(response).toEqual(createResponse('success', 'Workout created successfully', { workout: expectedWorkout }));
      expect(transport.request).toHaveBeenCalledWith(
        'template.get',
        expect.objectContaining({
          payload: {
            id: workoutData.templateId,
            userId: workoutData.userId
          }
        })
      );
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
        expect.objectContaining(workoutData)
      );
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

      expect(response).toEqual(createResponse('success', 'Exercise log created successfully', expectedResponse));
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

      expect(response).toEqual(createResponse('success', 'Workout updated successfully', expectedResponse));
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

      expect(response).toEqual(createResponse('success', 'Exercise log updated successfully', expectedResponse));
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

      jest.spyOn(mockWorkoutQueryService, 'getExerciseLogById').mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exerciseLog.get',
        {
          type: 'GET_EXERCISE_LOG',
          payload: fetchData
        }
      );

      expect(response).toEqual(createResponse('success', 'Exercise log fetched successfully', expectedResponse));
      expect(mockWorkoutQueryService.getExerciseLogById).toHaveBeenCalledWith(
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

      jest.spyOn(mockWorkoutQueryService, 'getExerciseLogsByDateRange')
        .mockResolvedValue(expectedResponse as any);

      const response = await transport.request(
        'exerciseLog.getByDateRange',
        {
          type: 'GET_EXERCISE_LOGS_BY_DATE_RANGE',
          payload: fetchData
        }
      );

      expect(response).toEqual(createResponse('success', 'Exercise logs fetched successfully', expectedResponse));
      expect(mockWorkoutQueryService.getExerciseLogsByDateRange)
        .toHaveBeenCalledWith({
          startDate: new Date(fetchData.startDate),
          endDate: new Date(fetchData.endDate),
          userId: fetchData.userId,
          kpiId: fetchData.kpiId
        });
    });
  });
}); 