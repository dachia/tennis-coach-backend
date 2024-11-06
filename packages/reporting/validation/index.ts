import * as yup from 'yup';

export const calculateProgressComparisonSchema = yup.object({
  exerciseId: yup.string().required('Exercise ID is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .required('End date is required')
});

export const calculateTotalProgressSchema = yup.object({
  exerciseId: yup.string().required('Exercise ID is required'),
  kpiId: yup.string().required('KPI ID is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .required('End date is required')
}); 