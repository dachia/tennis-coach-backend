import { Plan } from '../models/Plan';
import { mapPlan } from '../mappers/responseMappers';
import { AuthTransportClient } from '../../shared/transport/helpers/authTransport';
import { DomainError } from '../../shared/errors';
import mongoose from 'mongoose';
import { PlanDTO, RecurrenceType, WeekDay } from '../../shared/types';

interface PlannedDate {
  date: Date;
  plans: PlanDTO[];
}

interface GetPlannedDatesParams {
  traineeId?: string;
  exerciseId?: string;
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
  userId: string;
}

export class PlanningQueryService {
  constructor(
    private readonly planModel: typeof Plan,
    private readonly authTransportClient: AuthTransportClient
  ) {}

  async getPlanById(id: string, userId: string) {
    const plan = await this.planModel.findById(id);
    if (!plan) {
      throw new DomainError('Plan not found');
    }

    // Verify authorization
    if (userId !== plan.traineeId.toString() && 
        userId !== plan.coachId?.toString()) {
      throw new DomainError('Not authorized to view this plan');
    }

    return { plan: mapPlan(plan) };
  }

  async getPlansForUser(userId: string) {
    // Get plans where user is either trainee or coach
    const plans = await this.planModel.find({
      $or: [
        { traineeId: userId },
        { coachId: userId }
      ]
    }).sort({ startDate: 1 });

    return { plans: plans.map(plan => mapPlan(plan)) };
  }

  async getPlansForTrainee(traineeId: string, coachId: string) {
    // Verify coach-trainee relationship
    const relationshipResponse = await this.authTransportClient.getTraineesByCoach({
      coachId,
      userId: coachId
    });
    
    const isTraineeOfCoach = relationshipResponse.data?.payload.trainees
      .some(t => t._id === traineeId);
    
    if (!isTraineeOfCoach) {
      throw new DomainError('Not authorized to view plans for this trainee');
    }

    const plans = await this.planModel.find({
      traineeId
    }).sort({ startDate: 1 });

    return { plans: plans.map(plan => mapPlan(plan)) };
  }

  async getPlannedDates(params: GetPlannedDatesParams): Promise<PlannedDate[]> {
    const {
      traineeId,
      exerciseId,
      templateId,
      startDate = new Date(),
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from start
      userId
    } = params;

    // Build query based on provided parameters
    const query: any = {
      startDate: { $lte: endDate },
      $or: [
        { endDate: { $gte: startDate } },
        { endDate: null }
      ]
    };

    if (traineeId) {
      query.traineeId = new mongoose.Types.ObjectId(traineeId);
    }
    if (exerciseId) {
      query.exerciseId = new mongoose.Types.ObjectId(exerciseId);
    }
    if (templateId) {
      query.templateId = new mongoose.Types.ObjectId(templateId);
    }

    // Verify authorization if traineeId is provided
    if (traineeId && traineeId !== userId) {
      const relationshipResponse = await this.authTransportClient.getTraineesByCoach({
        coachId: userId,
        userId
      });
      
      const isTraineeOfCoach = relationshipResponse.data?.payload.trainees
        .some(t => t._id === traineeId);
      
      if (!isTraineeOfCoach) {
        throw new DomainError('Not authorized to view plans for this trainee');
      }
    }

    const plans = await this.planModel.find(query).sort({ startDate: 1 });
    const mappedPlans = plans.map(plan => mapPlan(plan));
    
    // Generate all dates between start and end date
    const dates: PlannedDate[] = [];
    const currentDate = new Date(startDate);
    const endDateTime = endDate.getTime();

    while (currentDate.getTime() <= endDateTime) {
      dates.push({
        date: new Date(currentDate),
        plans: []
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate plans for each date
    mappedPlans.forEach(plan => {
      const planStartDate = new Date(plan.startDate);
      const planEndDate = plan.endDate ? new Date(plan.endDate) : null;

      dates.forEach(dateObj => {
        const currentDate = dateObj.date;
        const dayOfWeek = currentDate.toDateString().slice(0, 3).toLowerCase();

        // Check if plan applies to this date
        const isWithinDateRange = currentDate >= planStartDate && 
          (!planEndDate || currentDate <= planEndDate);

        const isMatchingWeekDay = plan.recurrenceType === RecurrenceType.WEEKLY
          ? plan.weekDays?.includes(dayOfWeek as WeekDay)
          : plan.recurrenceType === RecurrenceType.ONCE && 
            currentDate.toDateString() === planStartDate.toDateString();

        if (isWithinDateRange && isMatchingWeekDay) {
          dateObj.plans.push(plan);
        }
      });
    });

    // Remove dates with no plans
    return dates.filter(date => date.plans.length > 0);
  }
} 