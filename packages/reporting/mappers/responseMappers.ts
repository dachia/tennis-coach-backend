import { IProgressComparison } from '../models/ProgressComparison';
import { ITotalProgress } from '../models/TotalProgress';

// Main Progress Comparison Mapper
export const mapProgressComparison = (comparison: IProgressComparison) => ({
  _id: comparison._id.toString(),
  logId: comparison.logId.toString(),
  kpiId: comparison.kpiId.toString(),
  userId: comparison.userId.toString(),
  kpiUnit: comparison.kpiUnit,
  kpiPerformanceGoal: comparison.kpiPerformanceGoal,
  comparisonValue: comparison.comparisonValue,
  comparisonPercent: comparison.comparisonPercent,
  comparisonDate: comparison.comparisonDate,
  logDate: comparison.logDate,
  actualValue: comparison.actualValue,
  notes: comparison.notes,
  createdAt: comparison.createdAt,
  updatedAt: comparison.updatedAt,
  kpiTags: comparison.kpiTags
});

// Main Total Progress Mapper
export const mapTotalProgress = (progress: ITotalProgress) => ({
  _id: progress._id.toString(),
  exerciseId: progress.exerciseId.toString(),
  kpiId: progress.kpiId.toString(),
  userId: progress.userId.toString(),
  progressValue: progress.progressValue,
  startDate: progress.startDate,
  endDate: progress.endDate,
  createdAt: progress.createdAt,
  updatedAt: progress.updatedAt
});

// Batch Mapping Helpers
export const mapProgressComparisons = (comparisons: IProgressComparison[]) => 
  comparisons.map(mapProgressComparison);

export const mapTotalProgresses = (progresses: ITotalProgress[]) => 
  progresses.map(mapTotalProgress); 