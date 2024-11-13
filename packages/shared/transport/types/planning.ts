import { BaseRequest } from './base';
import { PlanDTO, CreatePlanDTO, UpdatePlanDTO, ScheduledPlanDTO } from '../../types';
import { ResponsePayload } from '../../utils';
export namespace PlanningTransport {
  // Request/Response interfaces for Plan operations
  export interface CreatePlanRequest extends BaseRequest, CreatePlanDTO {}

  export interface CreatePlanResponse extends ResponsePayload<{
    plan: PlanDTO;
  }> {}

  export interface UpdatePlanRequest extends BaseRequest, UpdatePlanDTO {
    id: string;
  }

  export interface UpdatePlanResponse extends ResponsePayload<{
    plan: PlanDTO;
  }> {}

  export interface DeletePlanRequest extends BaseRequest {
    id: string;
    userId: string;
  }

  export interface DeletePlanResponse extends ResponsePayload<{
    success: boolean;
  }> {}

  export interface GetPlanByIdRequest extends BaseRequest {
    id: string;
    userId: string;
  }

  export interface GetPlanByIdResponse extends ResponsePayload<{
    plan: PlanDTO;
  }> {}

  export interface GetPlansRequest extends BaseRequest {
    userId: string;
  }

  export interface GetPlansResponse extends ResponsePayload<{
    plans: PlanDTO[];
  }> {}

  export interface GetTraineePlansRequest extends BaseRequest {
    traineeId: string;
    userId: string;
  }

  export interface GetTraineePlansResponse extends ResponsePayload<{
    plans: PlanDTO[];
  }> {}

  export interface GetPlannedDatesRequest extends BaseRequest {
    traineeId?: string;
    exerciseId?: string;
    templateId?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
  }

  export interface GetPlannedDatesResponse extends ResponsePayload<{
    plannedDates: {
      date: string; // ISO date string
      plans: PlanDTO[];
    }[];
  }> {}

  export interface SchedulePlanRequest extends BaseRequest {
    planId: string;
    scheduledDate: string; // ISO date string
  }

  export interface SchedulePlanResponse extends ResponsePayload<{
    scheduledPlan: ScheduledPlanDTO;
  }> {}
} 