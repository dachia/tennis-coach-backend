import { Transport, TransportRouter } from '../../shared/transport';
import { PlanningService } from '../services/planningService';
import { PlanningQueryService } from '../services/planningQueryService';
import { TransportRoutes } from '../../shared/transport/constants';
import { PlanningTransport } from '../../shared/transport/types/planning';
import { createResponse } from '../../shared/utils/response.utils';

export class PlanningTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly planningService: PlanningService,
    private readonly planningQueryService: PlanningQueryService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<
      PlanningTransport.CreatePlanRequest,
      PlanningTransport.CreatePlanResponse
    >(TransportRoutes.Plan.CREATE, async (payload) => {
      const response = await this.planningService.createPlan(payload);
      return createResponse('success', 'Plan created successfully', response);
    });

    this.router.register<
      PlanningTransport.UpdatePlanRequest,
      PlanningTransport.UpdatePlanResponse
    >(TransportRoutes.Plan.UPDATE, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.planningService.updatePlan(id, data);
      return createResponse('success', 'Plan updated successfully', response);
    });

    this.router.register<
      PlanningTransport.DeletePlanRequest,
      PlanningTransport.DeletePlanResponse
    >(TransportRoutes.Plan.DELETE, async (payload) => {
      const success = await this.planningService.deletePlan(payload.id, payload.userId);
      return createResponse('success', 'Plan deleted successfully', success);
    });

    this.router.register<
      PlanningTransport.GetPlanByIdRequest,
      PlanningTransport.GetPlanByIdResponse
    >(TransportRoutes.Plan.GET_BY_ID, async (payload) => {
      const response = await this.planningQueryService.getPlanById(payload.id, payload.userId);
      return createResponse('success', 'Plan fetched successfully', response);
    });

    this.router.register<
      PlanningTransport.GetPlansRequest,
      PlanningTransport.GetPlansResponse
    >(TransportRoutes.Plan.GET_ALL, async (payload) => {
      const response = await this.planningQueryService.getPlansForUser(payload.userId);
      return createResponse('success', 'Plans fetched successfully', response);
    });

    this.router.register<
      PlanningTransport.GetTraineePlansRequest,
      PlanningTransport.GetTraineePlansResponse
    >(TransportRoutes.Plan.GET_TRAINEE_PLANS, async (payload) => {
      const response = await this.planningQueryService.getPlansForTrainee(
        payload.traineeId,
        payload.userId
      );
      return createResponse('success', 'Trainee plans fetched successfully', response);
    });

    this.router.register<
      PlanningTransport.GetPlannedDatesRequest,
      PlanningTransport.GetPlannedDatesResponse
    >(TransportRoutes.Plan.GET_PLANNED_DATES, async (payload) => {
      const response = await this.planningQueryService.getPlannedDates({
        ...payload,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        userId: payload.userId
      });

      // Convert dates to ISO strings for transport
      const plannedDates = response.map(item => ({
        date: item.date.toISOString(),
        plans: item.plans
      }));

      return createResponse('success', 'Planned dates fetched successfully', { plannedDates });
    });
  }
} 