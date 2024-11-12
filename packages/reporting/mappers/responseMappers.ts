import { IProgressComparison } from '../models/ProgressComparison';
import { ITotalProgress } from '../models/TotalProgress';

// Main Progress Comparison Mapper
export const mapProgressComparison = (comparison: IProgressComparison) => ({
  _id: comparison._id.toString(),
  logId: comparison.logId.toString(),
  kpiId: comparison.kpiId.toString(),
  userId: comparison.userId.toString(),
  comparisonValue: comparison.comparisonValue,
  comparisonDate: comparison.comparisonDate,
  createdAt: comparison.createdAt,
  updatedAt: comparison.updatedAt
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