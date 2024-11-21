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

export interface CalculateProgressComparisonParams {
  logId: string;
  kpiId: string;
  userId: string;
  startDate?: Date;
}

export interface CalculateTotalProgressParams {
  exerciseId: string;
  kpiId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
}

export interface ProgressComparisonResponseDTO {
  _id: string;
  logId: string;
  kpiId: string;
  userId: string;
  comparisonValue: number;
  comparisonPercent: number;
  comparisonDate: Date;
  logDate: Date;
  actualValue: number;
  kpiUnit: string;
  kpiPerformanceGoal: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TotalProgressResponseDTO {
  _id: string;
  exerciseId: string;
  kpiId: string;
  userId: string;
  progressValue: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculateProgressComparisonResponseDTO {
  progressComparison: ProgressComparisonResponseDTO | null;
}

export interface CalculateTotalProgressResponseDTO {
  totalProgress: TotalProgressResponseDTO;
}
