import { Transport, TransportRouter } from '../../shared/transport';
import { ExerciseService } from '../services/exerciseService';
import { ExerciseQueryService } from '../services/exerciseQueryService';
import { TransportRoutes } from '../../shared/transport/constants';
import { ExerciseTransport } from '../../shared/transport/types/exercise';
import { createResponse } from '../../shared/utils/response.utils';

export class ExerciseTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly exerciseService: ExerciseService,
    private readonly exerciseQueryService: ExerciseQueryService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<
      ExerciseTransport.CreateExerciseRequest,
      ExerciseTransport.CreateExerciseResponse
    >(TransportRoutes.Exercise.CREATE, async (payload) => {
      const response = await this.exerciseService.createExerciseWithKPIs(payload);
      return createResponse('success', 'Exercise created successfully', response);
    });

    this.router.register<
      ExerciseTransport.UpdateExerciseRequest,
      ExerciseTransport.UpdateExerciseResponse
    >(TransportRoutes.Exercise.UPDATE, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.exerciseService.updateExercise(id, data);
      return createResponse('success', 'Exercise updated successfully', response);
    });

    this.router.register<
      ExerciseTransport.UpdateExerciseWithKPIsRequest,
      ExerciseTransport.UpdateExerciseWithKPIsResponse
    >(TransportRoutes.Exercise.UPDATE_WITH_KPIS, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.exerciseService.updateExerciseWithKPIs(id, data);
      return createResponse('success', 'Exercise updated successfully', response);
    });

    this.router.register<
      ExerciseTransport.DeleteExerciseRequest,
      ExerciseTransport.DeleteExerciseResponse
    >(TransportRoutes.Exercise.DELETE, async (payload) => {
      const success = await this.exerciseService.deleteExercise(payload.id, payload.userId);
      return createResponse('success', 'Exercise deleted successfully', { success });
    });

    this.router.register<
      ExerciseTransport.GetExerciseByIdRequest,
      ExerciseTransport.GetExerciseByIdResponse
    >(TransportRoutes.Exercise.GET_BY_ID, async (payload) => {
      const response = await this.exerciseQueryService.getExerciseById(payload.id, payload.userId);
      return createResponse('success', 'Exercise fetched successfully', response);
    });

    this.router.register<
      ExerciseTransport.GetExercisesRequest,
      ExerciseTransport.GetExercisesResponse
    >(TransportRoutes.Exercise.GET_ALL, async (payload) => {
      const response = await this.exerciseQueryService.getExercisesWithKPIs(payload.userId);
      return createResponse('success', 'Exercise fetched successfully', response);
    });

    // Template operations
    this.router.register<
      ExerciseTransport.CreateTemplateRequest,
      ExerciseTransport.CreateTemplateResponse
    >(TransportRoutes.Template.CREATE, async (payload) => {
      const response = await this.exerciseService.createTemplate(payload);
      return createResponse('success', 'Template created successfully', response);
    });

    this.router.register<
      ExerciseTransport.UpdateTemplateRequest,
      ExerciseTransport.UpdateTemplateResponse
    >(TransportRoutes.Template.UPDATE, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.exerciseService.updateTemplate(id, data);
      return createResponse('success', 'Template updated successfully', response);
    });

    this.router.register<
      ExerciseTransport.DeleteTemplateRequest,
      ExerciseTransport.DeleteTemplateResponse
    >(TransportRoutes.Template.DELETE, async (payload) => {
      const success = await this.exerciseService.deleteTemplate(payload.id, payload.userId);
      return createResponse('success', 'Template deleted successfully', { success });
    });

    this.router.register<
      ExerciseTransport.GetTemplateByIdRequest,
      ExerciseTransport.GetTemplateByIdResponse
    >(TransportRoutes.Template.GET_BY_ID, async (payload) => {
      const response = await this.exerciseQueryService.getTemplateById(payload.id, payload.userId);
      return createResponse('success', 'Template fetched successfully', response);
    });

    // KPI operations
    this.router.register<
      ExerciseTransport.UpdateKPIRequest,
      ExerciseTransport.UpdateKPIResponse
    >(TransportRoutes.KPI.UPDATE, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.exerciseService.updateKpi(id, data);
      return createResponse('success', 'KPI updated successfully', response);
    });

    // Resource operations
    this.router.register<
      ExerciseTransport.ShareResourceRequest,
      ExerciseTransport.ShareResourceResponse
    >(TransportRoutes.Resource.SHARE, async (payload) => {
      const response = await this.exerciseService.shareResource(payload);
      return createResponse('success', 'Resource shared successfully', response);
    });

    this.router.register<
      ExerciseTransport.DeleteResourceRequest,
      ExerciseTransport.DeleteResourceResponse
    >(TransportRoutes.Resource.DELETE, async (payload) => {
      const success = await this.exerciseService.deleteSharedResource(payload.id, payload.userId);
      return createResponse('success', 'Resource deleted successfully', { success });
    });

    this.router.register<
      ExerciseTransport.GetResourceSharesRequest,
      ExerciseTransport.GetResourceSharesResponse
    >(TransportRoutes.Resource.GET_SHARES, async (payload) => {
      const response = await this.exerciseQueryService.getResourceShares(payload.id, payload.userId);
      return createResponse('success', 'Resource shares fetched successfully', response);
    });

    this.router.register<
      ExerciseTransport.GetExercisesByIdsRequest,
      ExerciseTransport.GetExercisesByIdsResponse
    >(TransportRoutes.Exercise.GET_BY_IDS, async (payload) => {
      const response = await this.exerciseQueryService.getExercisesByIds(payload.ids, payload.userId);
      return createResponse('success', 'Exercises fetched successfully', response);
    });
  }

  async listen() {
    await this.router.listen();
  }

  async close() {
    await this.router.close();
  }
}
