import { IPlan } from '../models/Plan';
import { IScheduledPlan } from '../models/ScheduledPlan';

export const mapPlan = (plan: IPlan) => ({
  _id: plan._id.toString(),
  traineeId: plan.traineeId.toString(),
  coachId: plan.coachId?.toString(),
  templateId: plan.templateId?.toString(),
  exerciseId: plan.exerciseId?.toString(),
  name: plan.name,
  recurrenceType: plan.recurrenceType,
  weekDays: plan.weekDays,
  startDate: plan.startDate,
  endDate: plan.endDate,
  traineeName: plan.traineeName,
  traineeEmail: plan.traineeEmail,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt
});

export const mapScheduledPlan = (scheduledPlan: IScheduledPlan) => ({
  _id: scheduledPlan._id.toString(),
  planId: scheduledPlan.planId.toString(),
  scheduledDate: scheduledPlan.scheduledDate,
  scheduledBy: scheduledPlan.scheduledBy.toString(),
  createdAt: scheduledPlan.createdAt,
  updatedAt: scheduledPlan.updatedAt
}); 