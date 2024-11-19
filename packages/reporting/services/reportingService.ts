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
import { mapProgressComparison } from '../mappers/responseMappers';

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
    // console.log('previousLogs', previousLogs);

    // Find first log that doesn't match current log ID
    const previousLog = previousLogs?.length! > 1 ? previousLogs![previousLogs!.length - 2] : null;

    if (!previousLog || !previousLog.actualValue) {
      return { progressComparison: null };
    }

    // Check if comparison already exists
    const existingComparison = await this.progressComparisonModel.findOne({
      logId: params.logId,
      kpiId: params.kpiId,
      userId: params.userId,
      comparisonDate: currentLog.logDate
    });

    let comparison: IProgressComparison;
    const sign = currentLog.kpiPerformanceGoal === PerformanceGoal.MAXIMIZE ? 1 : -1;
    const difference = sign * (currentLog.actualValue - previousLog.actualValue);
    const changePercent = (difference / previousLog.actualValue) * 100;

    if (existingComparison) {
      existingComparison.comparisonValue = difference;
      existingComparison.comparisonPercent = changePercent;
      comparison = await existingComparison.save();
    } else {
      comparison = await new this.progressComparisonModel({
        logId: params.logId,
        kpiId: params.kpiId,
        userId: params.userId,
        comparisonValue: difference,
        comparisonPercent: changePercent,
        comparisonDate: currentLog.logDate,
        kpiPerformanceGoal: currentLog.kpiPerformanceGoal,
        exerciseId: currentLog.exerciseId,
        kpiUnit: currentLog.kpiUnit
      }).save() as IProgressComparison;
    }

    // Convert to DTO and return single comparison
    return {
      progressComparison: mapProgressComparison(comparison)
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