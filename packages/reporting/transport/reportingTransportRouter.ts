import { Transport, TransportRouter } from '../../shared/transport';
import { IProgressComparison } from '../models/ProgressComparison';
import { ITotalProgress } from '../models/TotalProgress';
import { ReportingService } from '../services/reportingService';

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
    this.router.register<any, { progressComparisons: IProgressComparison[] }>(
      'progress.calculate.comparison',
      async (payload) => {
        return this.reportingService.calculateProgressComparison(payload);
      }
    );

    this.router.register<any, { totalProgress: ITotalProgress }>(
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