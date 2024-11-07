import * as yup from 'yup';
import { WorkoutStatus, ExerciseLogStatus } from '../types';

export const createWorkoutSchema = yup.object({
  startTimestamp: yup.date(),
  endTimestamp: yup.date().when('startTimestamp', {
    is: (startTimestamp: Date) => startTimestamp != null,
    then: (schema) => schema.min(
      yup.ref('startTimestamp'),
      'End time must be after start time'
    )
  }),
  templateId: yup.string(),
  notes: yup.string(),
  media: yup.array().of(yup.string().url('Media must be valid URLs'))
});

export const createExerciseLogSchema = yup.object({
  workoutId: yup.string().required('Workout ID is required'),
  exerciseId: yup.string().required('Exercise ID is required'),
  kpiId: yup.string().required('KPI ID is required'),
  actualValue: yup.number().required('Actual value is required'),
  duration: yup.number()
    .min(0, 'Duration must be positive')
    .required('Duration is required'),
  notes: yup.string(),
  media: yup.array().of(yup.string().url('Media must be valid URLs'))
});

export const updateWorkoutSchema = yup.object({
  workoutDate: yup.date(),
  startTimestamp: yup.date(),
  endTimestamp: yup.date().when('startTimestamp', {
    is: (startTimestamp: Date) => startTimestamp != null,
    then: (schema) => schema.min(
      yup.ref('startTimestamp'),
      'End time must be after start time'
    )
  }),
  status: yup.string().oneOf(Object.values(WorkoutStatus)),
  notes: yup.string(),
  media: yup.array().of(yup.string().url('Media must be valid URLs'))
});

export const updateExerciseLogSchema = yup.object({
  actualValue: yup.number(),
  duration: yup.number().min(0, 'Duration must be positive'),
  status: yup.string().oneOf(Object.values(ExerciseLogStatus)),
  notes: yup.string(),
  media: yup.array().of(yup.string().url('Media must be valid URLs'))
});

export const dateRangeSchema = yup.object({
  startDate: yup.date()
    .required('Start date is required')
    .typeError('Invalid date format'),
  endDate: yup.date()
    .required('End date is required')
    .typeError('Invalid date format')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  userId: yup.string()
    .required('User ID is required'),
  traineeId: yup.string()
    .optional()
}); 