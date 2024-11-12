import { ProgressComparison } from '../models/ProgressComparison';
import { WorkoutTransportClient } from '../../shared';
import { PerformanceGoal } from '../../shared/constants/PerformanceGoal';
import { mapProgressComparison, mapProgressComparisons } from '../mappers/responseMappers';

interface GetProgressComparisonParams {
  logId: string;
  kpiId: string;
  userId: string;
}

interface GetTotalProgressParams {
  exerciseId: string;
  kpiId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
}

interface ProgressComparisonDTO {
  _id: string;
  logId: string;
  kpiId: string;
  userId: string;
  comparisonValue: number;
  comparisonDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TotalProgressDTO {
  exerciseId: string;
  kpiId: string;
  userId: string;
  progressValue: number;
  progressPercentage: number;
  startDate: Date;
  endDate: Date;
}

export class ReportingQueryService {
  constructor(
    private readonly progressComparisonModel: typeof ProgressComparison,
  ) { }

  async getProgressComparison(
    params: GetProgressComparisonParams
  ) {
    const comparison = await this.progressComparisonModel.findOne({
      logId: params.logId,
      kpiId: params.kpiId,
      userId: params.userId
    });

    if (!comparison) {
      return null;
    }

    return { progressComparison: mapProgressComparison(comparison) };
  }

  async getProgressComparisons(
    userId: string,
    kpiId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const comparisons = await this.progressComparisonModel.find({
      userId,
      kpiId,
      // createdAt: {
      //   $gte: startDate,
      //   $lte: endDate
      // }
    }).sort({ createdAt: 1 });

    return { progressComparisons: mapProgressComparisons(comparisons) };
  }

  async getTotalProgress(
    params: GetTotalProgressParams
  ) {
    // Get all exercise logs for the given period
    // const logsResponse = await this.workoutTransportClient.getExerciseLogsByDateRange({
    //   startDate: params.startDate.toISOString(),
    //   endDate: params.endDate.toISOString(),
    //   userId: params.userId,
    //   kpiId: params.kpiId
    // });

    // const logs = logsResponse.data?.payload.exerciseLogs;
    // if (!logs || logs.length < 2) {
    //   return null;
    // }

    // // Sort logs by date
    // const sortedLogs = [...logs].sort((a, b) => 
    //   new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    // );

    // const firstLog = sortedLogs[0];
    // const lastLog = sortedLogs[sortedLogs.length - 1];

    // if (!firstLog.actualValue || !lastLog.actualValue) {
    //   return null;
    // }

    // const sign = firstLog.kpiPerformanceGoal === PerformanceGoal.MAXIMIZE ? 1 : -1;
    // const progressValue = lastLog.actualValue - firstLog.actualValue;
    // const progressPercentage = sign * ((lastLog.actualValue - firstLog.actualValue) / firstLog.actualValue) * 100;

    // return {
    //   exerciseId: params.exerciseId,
    //   kpiId: params.kpiId,
    //   userId: params.userId,
    //   progressValue,
    //   progressPercentage,
    //   startDate: params.startDate,
    //   endDate: params.endDate
    // };
  }
} 