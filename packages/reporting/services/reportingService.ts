import { IProgressComparison, ProgressComparison } from '../models/ProgressComparison';
import { TotalProgress } from '../models/TotalProgress';
import { EventService, Transport } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import { 
  CalculateProgressComparisonParams, 
  CalculateTotalProgressParams,
  CalculateProgressComparisonResponseDTO,
  CalculateTotalProgressResponseDTO,
  ProgressComparisonResponseDTO
} from '../types';

export class ReportingService {
  constructor(
    private readonly progressComparisonModel: typeof ProgressComparison,
    private readonly totalProgressModel: typeof TotalProgress,
    private readonly eventService: EventService,
    private readonly transport: Transport
  ) {}

  async calculateProgressComparison(
    params: CalculateProgressComparisonParams
  ): Promise<CalculateProgressComparisonResponseDTO> {
    // 1. Fetch exercise log for the given logId
    const currentLog = await this.transport.request<any, { exerciseLog: any }>(
      'exerciseLog.get',
      {
        type: 'GET_EXERCISE_LOG',
        payload: {
          id: params.logId,
          userId: params.userId
        }
      }
    );

    if (!currentLog.exerciseLog) {
      throw new DomainError('Exercise log not found');
    }

    // 2. Fetch previous exercise logs for comparison
    const previousLogs = await this.transport.request<any, { exerciseLogs: any[] }>(
      'exerciseLog.getByDateRange',
      {
        type: 'GET_EXERCISE_LOGS_BY_DATE_RANGE',
        payload: {
          startDate: params.startDate || new Date(0),
          endDate: new Date(currentLog.exerciseLog.createdAt),
          userId: params.userId,
          kpiId: params.kpiId
        }
      }
    );

    // Find the most recent previous log
    const previousLog = previousLogs.exerciseLogs[previousLogs.exerciseLogs.length - 1];
    
    if (!previousLog) {
      return { progressComparison: null };
    }

    // Check if comparison already exists
    const existingComparison = await this.progressComparisonModel.findOne({
      logId: params.logId,
      kpiId: params.kpiId,
      userId: params.userId,
      comparisonDate: previousLog.createdAt
    });

    let comparison: IProgressComparison;
    
    if (existingComparison) {
      existingComparison.comparisonValue = ((currentLog.exerciseLog.actualValue - previousLog.actualValue) / previousLog.actualValue) * 100;
      comparison = await existingComparison.save();
    } else {
      comparison = await new this.progressComparisonModel({
        logId: params.logId,
        kpiId: params.kpiId,
        userId: params.userId,
        comparisonValue: ((currentLog.exerciseLog.actualValue - previousLog.actualValue) / previousLog.actualValue) * 100,
        comparisonDate: previousLog.createdAt
      }).save() as IProgressComparison;
    }

    // Convert to DTO and return single comparison
    return {
      progressComparison: {
        _id: comparison._id.toString(),
        logId: comparison.logId.toString(),
        kpiId: comparison.kpiId.toString(),
        userId: comparison.userId.toString(),
        comparisonValue: comparison.comparisonValue,
        comparisonDate: comparison.comparisonDate,
        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt
      }
    };
  }

  async calculateTotalProgress(
    params: CalculateTotalProgressParams
  ): Promise<CalculateTotalProgressResponseDTO> {
    // TODO: Implement logic to:
    // 1. Fetch all exercise logs for the given exercise and KPI
    // 2. Calculate overall progress based on KPI type and performance goals
    // 3. Store result in totalProgress collection
    // 4. Return total progress object
    
    throw new Error('Method not implemented');
  }
} 