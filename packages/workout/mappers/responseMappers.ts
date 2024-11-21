import { IWorkout } from '../models/Workout';
import { IExerciseLog } from '../models/ExerciseLog';

export const groupExerciseLogsByExerciseId = (exerciseLogs: IExerciseLog[]) => {
  return exerciseLogs.reduce((acc: any[], log: IExerciseLog) => {
    const mappedLog = mapExerciseLog(log);
    const existingExercise = acc.find(e => e.exerciseId === mappedLog.exerciseId);
    if (existingExercise) {
      existingExercise.logs.push(mappedLog);
    } else {
      acc.push({ exerciseId: mappedLog.exerciseId, exerciseName: mappedLog.exerciseTitle, exerciseDescription: mappedLog.exerciseDescription, logs: [mappedLog] });
    }
    return acc;
  }, []);
};
// Main Workout Mapper
export const mapWorkout = (
  workout: IWorkout,
) => ({
  _id: workout._id.toString(),
  traineeId: workout.traineeId.toString(),
  templateId: workout.templateId?.toString(),
  startTimestamp: workout.startTimestamp,
  endTimestamp: workout.endTimestamp,
  status: workout.status,
  name: workout.name,
  notes: workout.notes,
  media: workout.media,
  traineeEmail: workout.traineeEmail ?? '',
  traineeName: workout.traineeName ?? '',
  exerciseLogs: workout.exerciseLogs?.map(mapExerciseLog) ?? []
});

// Main Exercise Log Mapper
export const mapExerciseLog = (log: IExerciseLog) => ({
  _id: log._id.toString(),
  workoutId: log.workoutId.toString(),
  exerciseId: log.exerciseId.toString(),
  media: log.media ?? [],
  kpiId: log.kpiId.toString(),
  traineeId: log.traineeId.toString(),
  notes: log.notes ?? '',
  logDate: log.logDate,
  actualValue: log.actualValue,
  status: log.status,
  exerciseTitle: log.exerciseTitle,
  exerciseDescription: log.exerciseDescription,
  kpiUnit: log.kpiUnit,
  kpiPerformanceGoal: log.kpiPerformanceGoal,
  createdAt: log.createdAt,
  kpiTags: log.kpiTags,
  traineeEmail: log.traineeEmail,
  traineeName: log.traineeName
});
