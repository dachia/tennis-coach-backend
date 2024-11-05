import { Transport, TransportRouter } from '../../shared/transport';
import { IExercise } from '../models/Exercise';
import { IKPI } from '../models/KPI';
import { ISharedResource } from '../models/SharedResource';
import { ITrainingTemplate } from '../models/TrainingTemplate';
import { ExerciseService } from '../services/exerciseService';
import {
  ExerciseDTO,
  KPIDTO,
  TrainingTemplateDTO,
  SharedResourceDTO,
  ResourceType
} from '../types';

interface CreateExercisePayload {
  title: string;
  description: string;
  media: string[];
  userId: string;
}

interface CreateTemplatePayload {
  title: string;
  description: string;
  exerciseIds: string[];
  userId: string;
}

interface ShareResourcePayload {
  resourceType: ResourceType;
  resourceId: string;
  sharedWithId: string;
  userId: string;
}

export class ExerciseTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly exerciseService: ExerciseService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<CreateExercisePayload, { exercise: IExercise }>(
      'exercise.create',
      async (payload) => {
        return this.exerciseService.createExercise(payload);
      }
    );

    this.router.register<CreateTemplatePayload, { template: ITrainingTemplate }>(
      'template.create',
      async (payload) => {
        return this.exerciseService.createTemplate(payload);
      }
    );

    this.router.register<ShareResourcePayload, { sharedResource: ISharedResource }>(
      'resource.share',
      async (payload) => {
        return this.exerciseService.shareResource(payload);
      }
    );

    this.router.register<{ id: string; userId: string } & Partial<ExerciseDTO>, { exercise: IExercise | null }>(
      'exercise.update',
      async (payload) => {
        const { id, ...data } = payload;
        return this.exerciseService.updateExercise(id, data);
      }
    );

    this.router.register<{ id: string; userId: string } & Partial<KPIDTO>, {
      kpi: IKPI | null
    }>(
      'kpi.update',
      async (payload) => {
        const { id, ...data } = payload;
        return this.exerciseService.updateKpi(id, data);
      }
    );

    this.router.register<{ id: string; userId: string } & Partial<TrainingTemplateDTO>, {
      template: ITrainingTemplate | null
    }>(
      'template.update',
      async (payload) => {
        const { id, ...data } = payload;
        return this.exerciseService.updateTemplate(id, data);
      }
    );

    this.router.register<{ id: string; userId: string }, boolean>(
      'resource.delete',
      async (payload) => {
        const { id, userId } = payload;
        return this.exerciseService.deleteSharedResource(id, userId);
      }
    );
  }

  async listen() {
    await this.router.listen();
  }

  async close() {
    await this.router.close();
  }
}
