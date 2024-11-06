export interface ProgressComparisonDTO {
  exerciseId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  comparisonValues: {
    date: Date;
    value: number;
    percentageChange: number;
  }[];
}

export interface TotalProgressDTO {
  exerciseId: string;
  kpiId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  progressValue: number;
  progressPercentage: number;
} 