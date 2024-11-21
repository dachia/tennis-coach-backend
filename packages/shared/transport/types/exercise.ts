import { BaseRequest } from './base';
import { ResourceType, PerformanceGoal } from "../../constants/PerformanceGoal";
import { ResponsePayload } from '../../utils/response.utils';

export namespace ExerciseTransport {
  // Common interfaces
  export interface KPI {
    _id?: string;
    unit: string;
    performanceGoal: PerformanceGoal;
    exerciseId?: string;
    tags?: string[];
  }

  export interface Exercise {
    _id: string;
    title: string;
    description: string;
    media: string[];
    createdBy: string;
    kpis?: KPI[];
    isShared?: boolean;
    isArchived?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface Template {
    _id: string;
    title: string;
    description: string;
    exercises: string[] | Exercise[];
    createdBy: string;
  }

  export interface ResourceShare {
    _id: string;
    resourceType: ResourceType;
    resourceId: string;
    sharedWithId: string;
    sharedById: string;
  }

  export interface ShareInfo {
    email: string;
    name: string;
    sharedAt: Date;
  }

  // Create Exercise
  export interface CreateExerciseRequest extends BaseRequest {
    title: string;
    description: string;
    media: string[];
    kpis?: Array<{
      unit: string;
      performanceGoal: PerformanceGoal;
    }>;
  }

  export interface CreateExerciseResponse extends ResponsePayload<{
    exercise: Exercise;
  }> {}

  // Get Exercises
  export interface GetExercisesRequest extends BaseRequest {}

  export interface GetExercisesResponse extends ResponsePayload<{
    exercises: Exercise[];
  }> {}

  // Share Resource
  export interface ShareResourceRequest extends BaseRequest {
    resourceType: ResourceType;
    resourceId: string;
    sharedWithId: string;
  }

  export interface ShareResourceResponse extends ResponsePayload<{
    share: ResourceShare;
  }> {}

  // Get Exercise By ID
  export interface GetExerciseByIdRequest extends BaseRequest {
    id: string;
  }

  export interface GetExerciseByIdResponse extends ResponsePayload<{
    exercise: Exercise;
  }> {}

  // Update Exercise
  export interface UpdateExerciseRequest extends BaseRequest {
    id: string;
    title?: string;
    description?: string;
    media?: string[];
  }

  export interface UpdateExerciseResponse extends ResponsePayload<{
    exercise: Omit<Exercise, 'kpis'>;
  }> {}

  // Update Exercise with KPIs
  export interface UpdateExerciseWithKPIsRequest extends UpdateExerciseRequest {
    kpis?: Array<{
      _id?: string;
      goalValue: number;
      unit: string;
      performanceGoal: PerformanceGoal;
    }>;
  }

  export interface UpdateExerciseWithKPIsResponse extends ResponsePayload<{
    exercise: Exercise;
  }> {}

  // Template Operations
  export interface CreateTemplateRequest extends BaseRequest {
    title: string;
    description: string;
    exerciseIds: string[];
  }

  export interface CreateTemplateResponse extends ResponsePayload<{
    template: Template;
  }> {}

  export interface UpdateTemplateRequest extends BaseRequest {
    id: string;
    title?: string;
    description?: string;
    exerciseIds?: string[];
  }

  export interface UpdateTemplateResponse extends ResponsePayload<{
    template: Template;
  }> {}

  export interface GetTemplateByIdRequest extends BaseRequest {
    id: string;
  }

  export interface GetTemplateByIdResponse extends ResponsePayload<{
    template: Template & { exercises: Exercise[] };
  }> {}

  export interface GetTemplatesRequest extends BaseRequest {}

  export interface GetTemplatesResponse extends ResponsePayload<{
    templates: Template[];
  }> {}

  // Resource Shares
  export interface GetResourceSharesRequest extends BaseRequest {
    id: string;
  }

  export interface GetResourceSharesResponse extends ResponsePayload<{
    shares: ResourceShare[];
  }> {}

  // Delete Operations
  export interface DeleteExerciseRequest extends BaseRequest {
    id: string;
  }

  export interface DeleteExerciseResponse extends ResponsePayload<{
    success: boolean;
  }> {}

  export interface DeleteTemplateRequest extends BaseRequest {
    id: string;
  }

  export interface DeleteTemplateResponse extends ResponsePayload<{
    success: boolean;
  }> {}

  export interface DeleteResourceRequest extends BaseRequest {
    id: string;
  }

  export interface DeleteResourceResponse extends ResponsePayload<{
    success: boolean;
  }> {}

  // Get Exercises By IDs
  export interface GetExercisesByIdsRequest extends BaseRequest {
    ids: string[];
  }

  export interface GetExercisesByIdsResponse extends ResponsePayload<{
    exercises: Exercise[];
  }> {}

  // Add after the existing KPI interface
  export interface UpdateKPIRequest extends BaseRequest {
    id: string;
    goalValue?: number;
    unit?: string;
    performanceGoal?: PerformanceGoal;
  }

  export interface UpdateKPIResponse extends ResponsePayload<{
    kpi: KPI;
  }> {}
} 