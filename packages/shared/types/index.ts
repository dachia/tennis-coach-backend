import { UserRole } from "../constants";

export enum RecurrenceType {
  ONCE = 'once',
  WEEKLY = 'weekly'
}

export enum WeekDay {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export interface PlanDTO {
  _id: string;
  traineeId: string;
  coachId?: string;
  templateId?: string;
  exerciseId?: string;
  name: string;
  recurrenceType: RecurrenceType;
  weekDays?: WeekDay[];
  startDate: Date;
  endDate?: Date;
  traineeName: string;
  traineeEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanDTO {
  traineeId: string;
  templateId?: string;
  exerciseId?: string;
  recurrenceType: RecurrenceType;
  weekDays?: WeekDay[];
  startDate: Date;
  endDate?: Date;
  userId: string;
  // Note: traineeName and traineeEmail will be populated from the service
}

export interface UpdatePlanDTO {
  name?: string;
  recurrenceType?: RecurrenceType;
  weekDays?: WeekDay[];
  startDate?: Date;
  endDate?: Date;
  userId: string;
  // Note: traineeName and traineeEmail cannot be updated directly
}

export interface ScheduledPlanDTO {
  _id: string;
  planId: string;
  scheduledDate: Date;
  scheduledBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledPlanDTO {
  planId: string;
  scheduledDate: Date;
  userId: string; // scheduledBy
  userRole: UserRole;
} 