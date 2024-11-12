import * as yup from 'yup';
import { PerformanceGoal, ResourceType } from "../../shared/constants/PerformanceGoal";

export const kpiSchema = yup.object({
  unit: yup.string().required('Unit is required'),
  performanceGoal: yup.string()
    .oneOf(Object.values(PerformanceGoal), 'Invalid performance goal')
    .required('Performance goal is required')
});

export const createExerciseSchema = yup.object({
  title: yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .required('Title is required'),
  description: yup.string()
    .min(10, 'Description must be at least 10 characters')
    .required('Description is required'),
  media: yup.array().of(yup.string().url('Media must be valid URLs')),
  tags: yup.array().of(yup.string()).default([]),
  kpis: yup.array().of(kpiSchema)
});

export const createTemplateSchema = yup.object({
  title: yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .required('Title is required'),
  description: yup.string()
    .min(10, 'Description must be at least 10 characters')
    .required('Description is required'),
  exerciseIds: yup.array()
    .of(yup.string().required())
    .min(1, 'Template must contain at least one exercise')
    .required('Exercise IDs are required')
});

export const shareResourceSchema = yup.object({
  resourceType: yup.string()
    .oneOf(Object.values(ResourceType), 'Invalid resource type')
    .required('Resource type is required'),
  resourceId: yup.string()
    .required('Resource ID is required'),
  sharedWithId: yup.string()
    .required('Shared with user ID is required')
});

export const updateExerciseSchema = yup.object({
  title: yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: yup.string()
    .min(10, 'Description must be at least 10 characters'),
  media: yup.array().of(yup.string().url('Media must be valid URLs')),
  tags: yup.array().of(yup.string())
});

export const updateKpiSchema = yup.object({
  unit: yup.string(),
  performanceGoal: yup.string()
    .oneOf(Object.values(PerformanceGoal), 'Invalid performance goal')
});

export const updateTemplateSchema = yup.object({
  title: yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: yup.string()
    .min(10, 'Description must be at least 10 characters'),
  exerciseIds: yup.array()
    .of(yup.string())
    .min(1, 'Template must contain at least one exercise')
});

export const updateExerciseWithKPIsSchema = yup.object({
  title: yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: yup.string()
    .min(10, 'Description must be at least 10 characters'),
  media: yup.array().of(yup.string().url('Media must be valid URLs')),
  tags: yup.array().of(yup.string()),
  kpis: yup.array().of(
    yup.object({
      _id: yup.string(),
      unit: yup.string().required('Unit is required'),
      performanceGoal: yup.string()
        .oneOf(Object.values(PerformanceGoal), 'Invalid performance goal')
        .required('Performance goal is required')
    })
  )
});

export const shareResponseSchema = yup.object({
  shares: yup.array().of(
    yup.object({
      email: yup.string().email().required(),
      name: yup.string().required(),
      sharedAt: yup.date().required()
    })
  ).required()
}); 