import { InMemoryTransport } from '../../../shared/transport/inMemoryTransport';
import { ReportingTransportRouter } from '../reportingTransportRouter';
import { ReportingService } from '../../services/reportingService';
import { DomainError } from '../../../shared/errors/DomainError';

const mockReportingService = {
  calculateProgressComparison: jest.fn(),
  calculateTotalProgress: jest.fn()
} as unknown as ReportingService;

describe('ReportingTransportRouter', () => {
  let transport: InMemoryTransport;
  let reportingTransportRouter: ReportingTransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    reportingTransportRouter = new ReportingTransportRouter(transport, mockReportingService);
    await reportingTransportRouter.listen();
  });

  afterEach(async () => {
    await reportingTransportRouter.close();
    await transport.disconnect();
    jest.clearAllMocks();
  });

  describe('progress.calculate.comparison', () => {
    it('should handle progress comparison calculation requests', async () => {
      const comparisonData = {
        logId: 'log123',
        kpiId: 'kpi123',
        userId: 'user123',
        startDate: new Date()
      };

      const expectedResponse = {
        progressComparison:
        {
          _id: 'comparison123',
          logId: comparisonData.logId,
          kpiId: comparisonData.kpiId,
          userId: comparisonData.userId,
          comparisonValue: 25,
          comparisonDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      jest.spyOn(mockReportingService, 'calculateProgressComparison')
        .mockResolvedValue(expectedResponse);

      const response = await transport.request(
        'progress.calculate.comparison',
        {
          type: 'CALCULATE_PROGRESS_COMPARISON',
          payload: comparisonData
        }
      );

      expect(response).toEqual(expectedResponse);
      expect(mockReportingService.calculateProgressComparison)
        .toHaveBeenCalledWith(comparisonData);
    });

    it('should handle errors properly', async () => {
      const comparisonData = {
        logId: 'invalid-log',
        kpiId: 'kpi123',
        userId: 'user123'
      };

      jest.spyOn(mockReportingService, 'calculateProgressComparison')
        .mockRejectedValue(new DomainError('Exercise log not found'));

      const error: any = await transport.request(
        'progress.calculate.comparison',
        {
          type: 'CALCULATE_PROGRESS_COMPARISON',
          payload: comparisonData
        }
      );

      expect(error.message).toBe('Exercise log not found');
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
}); 