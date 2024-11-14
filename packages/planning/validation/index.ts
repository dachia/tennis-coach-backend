import * as yup from 'yup';
import { RecurrenceType, WeekDay } from '../../shared/types';

export const createPlanSchema = yup.object({
  traineeId: yup.string(),
  templateId: yup.string(),
  exerciseId: yup.string(),
  recurrenceType: yup.string()
    .oneOf(Object.values(RecurrenceType))
    .required('Recurrence type is required'),
  weekDays: yup.array()
    .of(yup.string().oneOf(Object.values(WeekDay)))
    .when('recurrenceType', {
      is: RecurrenceType.WEEKLY,
      then: schema => schema.required('Week days are required for weekly recurrence')
        .min(1, 'At least one week day must be selected')
    }),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date()
    .min(yup.ref('startDate'), 'End date must be after start date').optional()
});

export const updatePlanSchema = yup.object({
  recurrenceType: yup.string().oneOf(Object.values(RecurrenceType)),
  weekDays: yup.array()
    .of(yup.string().oneOf(Object.values(WeekDay)))
    .when('recurrenceType', {
      is: RecurrenceType.WEEKLY,
      then: schema => schema.min(1, 'At least one week day must be selected')
    }),
  startDate: yup.date(),
  endDate: yup.date()
    .min(yup.ref('startDate'), 'End date must be after start date')
});

export const createScheduledPlanSchema = yup.object({
  planId: yup.string().required('Plan ID is required'),
  scheduledDate: yup.date().required('Scheduled date is required')
}); 