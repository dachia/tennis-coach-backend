import { IProgressComparison, ProgressComparison } from '../models/ProgressComparison';
import { WorkoutTransportClient } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import {
  CalculateProgressComparisonParams,
  CalculateTotalProgressParams,
  CalculateProgressComparisonResponseDTO,
  CalculateTotalProgressResponseDTO,
} from '../types';
// import { PerformanceGoal } from '../../shared/constants/PerformanceGoal';
import { mapProgressComparison } from '../mappers/responseMappers';
import mongoose from 'mongoose';

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
    const previousLog = previousLogs?.length! > 1 ? previousLogs![previousLogs!.length - 2] : null;

    // Check if comparison already exists
    const existingComparison = await this.progressComparisonModel.findOne({
      logId: params.logId,
      kpiId: params.kpiId,
      userId: params.userId,
      logDate: currentLog.logDate
    });

    let comparison: IProgressComparison;
    // const sign = currentLog.kpiPerformanceGoal === PerformanceGoal.MAXIMIZE ? 1 : -1;
    const difference = previousLog?.actualValue ? (currentLog.actualValue - previousLog.actualValue) : currentLog.actualValue;
    const changePercent = previousLog?.actualValue ? (difference / previousLog.actualValue) * 100 : 100;
    const comparisonData = {
      comparisonValue: difference,
      comparisonPercent: changePercent,
      comparisonDate: new Date(),
      comparedToLogs: previousLog ? [new mongoose.Types.ObjectId(previousLog._id)] : []
    }

    if (existingComparison) {
      existingComparison.comparisonValue = comparisonData.comparisonValue;
      existingComparison.comparisonPercent = comparisonData.comparisonPercent;
      existingComparison.comparisonDate = comparisonData.comparisonDate;
      existingComparison.logDate = currentLog.logDate!;
      existingComparison.actualValue = currentLog.actualValue!;
      existingComparison.notes = currentLog.notes;
      existingComparison.kpiTags = currentLog.kpiTags;
      existingComparison.comparedToLogs = comparisonData.comparedToLogs
      comparison = await existingComparison.save();
    } else {
      comparison = await new this.progressComparisonModel({
        logId: params.logId,
        kpiId: params.kpiId,
        userId: params.userId,
        ...comparisonData,
        logDate: currentLog.logDate,
        actualValue: currentLog.actualValue,
        kpiPerformanceGoal: currentLog.kpiPerformanceGoal,
        exerciseId: currentLog.exerciseId,
        kpiUnit: currentLog.kpiUnit,
        notes: currentLog.notes,
        kpiTags: currentLog.kpiTags
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

  async deleteProgressData(params: {
    logId: string;
    kpiId: string;
    userId: string;
  }) {
    // Find all progress comparisons that reference this log
    const affectedComparisons = await this.progressComparisonModel.find({
      $or: [
        { // Direct comparisons for this log
          logId: params.logId,
          kpiId: params.kpiId,
          userId: params.userId
        },
        { // Comparisons that use this log as a reference
          comparedToLogs: new mongoose.Types.ObjectId(params.logId),
          kpiId: params.kpiId,
          userId: params.userId
        }
      ]
    });

    // Delete all affected comparisons
    await this.progressComparisonModel.deleteMany({
      _id: { $in: affectedComparisons.map(c => c._id) }
    });

    // Recalculate comparisons for logs that referenced the deleted log
    const logsToRecalculate = affectedComparisons
      .filter(c => c.logId.toString() !== params.logId) // Exclude the deleted log
      .map(c => c.logId.toString());

    // Trigger recalculation for each affected log
    await Promise.all(logsToRecalculate.map(logId => 
      this.calculateProgressComparison({
        logId,
        kpiId: params.kpiId,
        userId: params.userId
      })
    ));

    return true;
  }
} 