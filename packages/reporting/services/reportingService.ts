import { IProgressComparison, ProgressComparison } from '../models/ProgressComparison';
import { WorkoutTransportClient } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import {
  CalculateProgressComparisonParams,
  CalculateTotalProgressParams,
  CalculateProgressComparisonResponseDTO,
  CalculateTotalProgressResponseDTO,
} from '../types';
import { PerformanceGoal } from '../../shared/constants/PerformanceGoal';

export class ReportingService {
  constructor(
    private readonly progressComparisonModel: typeof ProgressComparison,
    private readonly workoutTransportClient: WorkoutTransportClient
  ) { }

  async calculateProgressComparison(
    params: CalculateProgressComparisonParams
  ): Promise<CalculateProgressComparisonResponseDTO> {
    // 1. Fetch exercise log for the given logId
    const currentLogResponse = await this.workoutTransportClient.getExerciseLog({
      id: params.logId,
      userId: params.userId
    });
    const currentLog = currentLogResponse.data?.payload.exerciseLog

    if (!currentLog) {
      throw new DomainError('Exercise log not found');
    }
    if (!currentLog.actualValue) {
      return { progressComparison: null };
    }

    // 2. Fetch previous exercise logs for comparison
    const previousLogsResponse = await this.workoutTransportClient.getExerciseLogsByDateRange({
      startDate: new Date(0).toISOString(),
      endDate: new Date(currentLog.createdAt).toISOString(),
      userId: params.userId,
      kpiId: params.kpiId
    });
    const previousLogs = previousLogsResponse.data?.payload.exerciseLogs;

    // Find first log that doesn't match current log ID
    const previousLog = previousLogs?.find(log => log._id !== currentLog._id);

    if (!previousLog || !previousLog.actualValue) {
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
    const sign = currentLog.kpiPerformanceGoal === PerformanceGoal.MAXIMIZE ? 1 : -1;
    const change = sign * ((currentLog.actualValue - previousLog.actualValue) / previousLog.actualValue) * 100;


    if (existingComparison) {
      existingComparison.comparisonValue = change;
      comparison = await existingComparison.save();
    } else {
      comparison = await new this.progressComparisonModel({
        logId: params.logId,
        kpiId: params.kpiId,
        userId: params.userId,
        comparisonValue: change,
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