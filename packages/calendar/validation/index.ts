import * as yup from 'yup';

export const getCalendarEventsSchema = yup.object({
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