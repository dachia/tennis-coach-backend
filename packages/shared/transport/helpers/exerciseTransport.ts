import { TransportRoutes } from '../constants';
import { Transport } from '../transport';
import { ExerciseTransport } from '../types/exercise';
import { createTypedRequest } from './typeRequest';

export class ExerciseTransportClient {
  constructor(private transport: Transport) {}

  async createExercise(payload: ExerciseTransport.CreateExerciseRequest) {
    return createTypedRequest<
      ExerciseTransport.CreateExerciseRequest,
      ExerciseTransport.CreateExerciseResponse
    >(this.transport, TransportRoutes.Exercise.CREATE, payload);
  }

  async updateExercise(payload: ExerciseTransport.UpdateExerciseRequest) {
    return createTypedRequest<
      ExerciseTransport.UpdateExerciseRequest,
      ExerciseTransport.UpdateExerciseResponse
    >(this.transport, TransportRoutes.Exercise.UPDATE, payload);
  }

  async updateExerciseWithKPIs(payload: ExerciseTransport.UpdateExerciseWithKPIsRequest) {
    return createTypedRequest<
      ExerciseTransport.UpdateExerciseWithKPIsRequest,
      ExerciseTransport.UpdateExerciseWithKPIsResponse
    >(this.transport, TransportRoutes.Exercise.UPDATE_WITH_KPIS, payload);
  }

  async deleteExercise(payload: ExerciseTransport.DeleteExerciseRequest) {
    return createTypedRequest<
      ExerciseTransport.DeleteExerciseRequest,
      ExerciseTransport.DeleteExerciseResponse
    >(this.transport, TransportRoutes.Exercise.DELETE, payload);
  }

  async getExercise(payload: ExerciseTransport.GetExerciseByIdRequest) {
    return createTypedRequest<
      ExerciseTransport.GetExerciseByIdRequest,
      ExerciseTransport.GetExerciseByIdResponse
    >(this.transport, TransportRoutes.Exercise.GET_BY_ID, payload);
  }

  async getExercises(payload: ExerciseTransport.GetExercisesRequest) {
    return createTypedRequest<
      ExerciseTransport.GetExercisesRequest,
      ExerciseTransport.GetExercisesResponse
    >(this.transport, TransportRoutes.Exercise.GET_ALL, payload);
  }

  async getExercisesByIds(payload: ExerciseTransport.GetExercisesByIdsRequest) {
    return createTypedRequest<
      ExerciseTransport.GetExercisesByIdsRequest,
      ExerciseTransport.GetExercisesByIdsResponse
    >(this.transport, TransportRoutes.Exercise.GET_BY_IDS, payload);
  }

  async createTemplate(payload: ExerciseTransport.CreateTemplateRequest) {
    return createTypedRequest<
      ExerciseTransport.CreateTemplateRequest,
      ExerciseTransport.CreateTemplateResponse
    >(this.transport, TransportRoutes.Template.CREATE, payload);
  }

  async updateTemplate(payload: ExerciseTransport.UpdateTemplateRequest) {
    return createTypedRequest<
      ExerciseTransport.UpdateTemplateRequest,
      ExerciseTransport.UpdateTemplateResponse
    >(this.transport, TransportRoutes.Template.UPDATE, payload);
  }

  async deleteTemplate(payload: ExerciseTransport.DeleteTemplateRequest) {
    return createTypedRequest<
      ExerciseTransport.DeleteTemplateRequest,
      ExerciseTransport.DeleteTemplateResponse
    >(this.transport, TransportRoutes.Template.DELETE, payload);
  }

  async getTemplate(payload: ExerciseTransport.GetTemplateByIdRequest) {
    return createTypedRequest<
      ExerciseTransport.GetTemplateByIdRequest,
      ExerciseTransport.GetTemplateByIdResponse
    >(this.transport, TransportRoutes.Template.GET_BY_ID, payload);
  }

  async getTemplates(payload: ExerciseTransport.GetTemplatesRequest) {
    return createTypedRequest<
      ExerciseTransport.GetTemplatesRequest,
      ExerciseTransport.GetTemplatesResponse
    >(this.transport, TransportRoutes.Template.GET_ALL, payload);
  }

  async shareResource(payload: ExerciseTransport.ShareResourceRequest) {
    return createTypedRequest<
      ExerciseTransport.ShareResourceRequest,
      ExerciseTransport.ShareResourceResponse
    >(this.transport, TransportRoutes.Resource.SHARE, payload);
  }

  async deleteResource(payload: ExerciseTransport.DeleteResourceRequest) {
    return createTypedRequest<
      ExerciseTransport.DeleteResourceRequest,
      ExerciseTransport.DeleteResourceResponse
    >(this.transport, TransportRoutes.Resource.DELETE, payload);
  }

  async getResourceShares(payload: ExerciseTransport.GetResourceSharesRequest) {
    return createTypedRequest<
      ExerciseTransport.GetResourceSharesRequest,
      ExerciseTransport.GetResourceSharesResponse
    >(this.transport, TransportRoutes.Resource.GET_SHARES, payload);
  }
} 