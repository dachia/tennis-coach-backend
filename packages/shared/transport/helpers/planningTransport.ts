import { Transport } from '../transport';
import { TransportRoutes } from '../constants';
import { PlanningTransport } from '../types/planning';
import { createTypedRequest } from './typeRequest';

export class PlanningTransportClient {
  constructor(private readonly transport: Transport) {}

  async createPlan(payload: PlanningTransport.CreatePlanRequest) {
    return createTypedRequest<
      PlanningTransport.CreatePlanRequest,
      PlanningTransport.CreatePlanResponse
    >(this.transport, TransportRoutes.Plan.CREATE, payload);
  }

  async updatePlan(payload: PlanningTransport.UpdatePlanRequest) {
    return createTypedRequest<
      PlanningTransport.UpdatePlanRequest,
      PlanningTransport.UpdatePlanResponse
    >(this.transport, TransportRoutes.Plan.UPDATE, payload);
  }

  async deletePlan(payload: PlanningTransport.DeletePlanRequest) {
    return createTypedRequest<
      PlanningTransport.DeletePlanRequest,
      PlanningTransport.DeletePlanResponse
    >(this.transport, TransportRoutes.Plan.DELETE, payload);
  }

  async getPlanById(payload: PlanningTransport.GetPlanByIdRequest) {
    return createTypedRequest<
      PlanningTransport.GetPlanByIdRequest,
      PlanningTransport.GetPlanByIdResponse
    >(this.transport, TransportRoutes.Plan.GET_BY_ID, payload);
  }

  async getPlans(payload: PlanningTransport.GetPlansRequest) {
    return createTypedRequest<
      PlanningTransport.GetPlansRequest,
      PlanningTransport.GetPlansResponse
    >(this.transport, TransportRoutes.Plan.GET_ALL, payload);
  }

  async getTraineePlans(payload: PlanningTransport.GetTraineePlansRequest) {
    return createTypedRequest<
      PlanningTransport.GetTraineePlansRequest,
      PlanningTransport.GetTraineePlansResponse
    >(this.transport, TransportRoutes.Plan.GET_TRAINEE_PLANS, payload);
  }

  async getPlannedDates(payload: PlanningTransport.GetPlannedDatesRequest) {
    return createTypedRequest<
      PlanningTransport.GetPlannedDatesRequest,
      PlanningTransport.GetPlannedDatesResponse
    >(this.transport, TransportRoutes.Plan.GET_PLANNED_DATES, payload);
  }
} 