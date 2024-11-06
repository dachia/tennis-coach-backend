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
  }

  async listen() {
    await this.router.listen();
  }

  async close() {
    await this.router.close();
  }
} 