import { IWorkout } from '../models/Workout';
import { IExerciseLog } from '../models/ExerciseLog';
import { EnrichedWorkoutDTO, GetCompletedWorkoutsResponseDTO } from '../types';

export const mapWorkoutToDTO = (
  workout: IWorkout,
  traineeInfo?: { email?: string; name?: string },
  exercises?: Array<{
    exerciseId: string;
    exerciseName?: string;
    logs: IExerciseLog[];
  }>
): EnrichedWorkoutDTO => ({
  _id: workout._id.toString(),
  traineeId: workout.traineeId.toString(),
  templateId: workout.templateId?.toString(),
  startTimestamp: workout.startTimestamp,
  status: workout.status,
  name: workout.name,
  traineeEmail: traineeInfo?.email ?? '',
  traineeName: traineeInfo?.name ?? '',
  exerciseLogs: [],
  exercises: exercises?.map(exercise => ({
    ...exercise,
    exerciseName: exercise.exerciseName ?? '',
    logs: exercise.logs.map(mapExerciseLogToDTO)
  })) || []
});

export const mapExerciseLogToDTO = (log: IExerciseLog) => ({
  _id: log._id.toString(),
  workoutId: log.workoutId.toString(),
  exerciseId: log.exerciseId.toString(),
  kpiId: log.kpiId.toString(),
  traineeId: log.traineeId.toString(),
  logDate: log.logDate,
  actualValue: log.actualValue,
  status: log.status,
  exerciseTitle: log.exerciseTitle,
  exerciseDescription: log.exerciseDescription,
  kpiGoalValue: log.kpiGoalValue,
  kpiUnit: log.kpiUnit,
  kpiPerformanceGoal: log.kpiPerformanceGoal
});

export const mapWorkoutsToResponse = (
  workouts: IWorkout[],
  traineeMap: Map<string, { email: string; name: string }>,
  exerciseMap: Map<string, {
    exerciseId: string;
    exerciseName: string;
    logs: IExerciseLog[];
  }>
): GetCompletedWorkoutsResponseDTO => ({
  workouts: workouts.map(workout => mapWorkoutToDTO(
    workout,
    traineeMap.get(workout.traineeId.toString()),
    exerciseMap.get(workout._id.toString())
      ? [exerciseMap.get(workout._id.toString())!]
      : []
  ))
});
