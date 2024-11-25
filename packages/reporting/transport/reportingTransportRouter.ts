import { EventRoutes } from '../../shared/events/constants';
import { WorkoutEvents } from '../../shared/events/types/workout';
import { Transport, TransportRouter } from '../../shared/transport';
import { ReportingService } from '../services/reportingService';
import { CalculateProgressComparisonParams, CalculateProgressComparisonResponseDTO, CalculateTotalProgressParams, CalculateTotalProgressResponseDTO } from '../types';

export class ReportingTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly reportingService: ReportingService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<WorkoutEvents.ExerciseLogUpdated['payload'], void>(
      EventRoutes.ExerciseLog.UPDATED,
      async (payload) => {
        await this.reportingService.calculateProgressComparison({
          logId: payload.exerciseLogId,
          kpiId: payload.kpiId,
          userId: payload.userId
        });
      }
    );
    this.router.register<WorkoutEvents.ExerciseLogCreated['payload'], void>(
      EventRoutes.ExerciseLog.CREATED,
      async (payload) => {
        await this.reportingService.calculateProgressComparison({
          logId: payload.exerciseLogId,
          kpiId: payload.kpiId,
          userId: payload.userId
        });
      }
    );
    this.router.register<CalculateProgressComparisonParams, CalculateProgressComparisonResponseDTO>(
      'progress.calculate.comparison',
      async (payload) => {
        return this.reportingService.calculateProgressComparison(payload);
      }
    );

    this.router.register<CalculateTotalProgressParams, CalculateTotalProgressResponseDTO>(
      'progress.calculate.total',
      async (payload) => {
        return this.reportingService.calculateTotalProgress(payload);
      }
    );

    this.router.register<WorkoutEvents.ExerciseLogDeleted['payload'], void>(
      EventRoutes.ExerciseLog.DELETED,
      async (payload) => {
        await this.reportingService.deleteProgressData({
          logId: payload.exerciseLogId,
          kpiId: payload.kpiId,
          userId: payload.userId
        });
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