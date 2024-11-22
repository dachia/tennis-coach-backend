import { DomainError } from '../../shared/errors';
import { EventService } from '../../shared/events/eventService';
import { AuthTransportClient } from '../../shared/transport/helpers/authTransport';
import { ExerciseTransportClient } from '../../shared/transport/helpers/exerciseTransport';
import { Plan } from '../models/Plan';
import { CreatePlanDTO, UpdatePlanDTO, RecurrenceType } from '../../shared/types';
import { createPlanSchema, updatePlanSchema } from '../validation';
import { WorkoutStatus } from '../../workout/types';
import { mapPlan, mapScheduledPlan } from '../mappers/responseMappers';
import { ScheduledPlan } from '../models/ScheduledPlan';
import { CreateScheduledPlanDTO } from '../../shared/types';
import { createScheduledPlanSchema } from '../validation';
import { PlanningQueryService } from '../services/planningQueryService';

export class PlanningService {
  constructor(
    private readonly planModel: typeof Plan,
    private readonly scheduledPlanModel: typeof ScheduledPlan,
    private readonly planningQueryService: PlanningQueryService,
    private readonly eventService: EventService,
    private readonly exerciseTransportClient: ExerciseTransportClient,
    private readonly authTransportClient: AuthTransportClient
  ) {}

  async createPlan(data: CreatePlanDTO) {
    let validatedData;
    const traineeId = data.traineeId || data.userId;
    try {
      validatedData = await createPlanSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.errors.join(', '));
    }

    // Get trainee information for denormalization
    const userResponse = await this.authTransportClient.getUsersByIds({
      ids: [traineeId],
      userId: data.userId
    });
    
    const trainee = userResponse.data?.payload.users[0];
    if (!trainee) {
      throw new DomainError('Trainee not found');
    }

    // If user is not the trainee, verify coach-trainee relationship
    if (data.userId !== traineeId) {
      const relationshipResponse = await this.authTransportClient.getTraineesByCoach({
        coachId: data.userId,
        userId: data.userId
      });
      
      const isTraineeOfCoach = relationshipResponse.data?.payload.trainees
        .some(t => t._id === traineeId);
      
      if (!isTraineeOfCoach) {
        throw new DomainError('Not authorized to create plan for this trainee');
      }
    }
    let templateResponse;
    let exercisesResponse;

    // If template provided, verify it exists and is accessible
    if (validatedData.templateId) {
      templateResponse = await this.exerciseTransportClient.getTemplate({
        id: validatedData.templateId,
        userId: data.userId
      });
      
      if (!templateResponse.data?.payload.template) {
        throw new DomainError('Template not found or not accessible');
      }
    }

    // If individual exercises provided, verify they exist and are accessible
    if (validatedData.exerciseId) {
      exercisesResponse = await this.exerciseTransportClient.getExercisesByIds({
        ids: [validatedData.exerciseId],
        userId: data.userId
      });
      
      if (!exercisesResponse.data?.payload.exercises) {
        throw new DomainError('Exercise not found or not accessible');
      }
    }
    const name = templateResponse?.data?.payload.template?.title || exercisesResponse?.data?.payload.exercises[0].title;

    const plan = await this.planModel.create({
      ...validatedData,
      name, 
      coachId: data.userId !== traineeId ? data.userId : undefined,
      traineeId,
      traineeName: trainee.name,
      traineeEmail: trainee.email
    });

    await this.eventService.publishDomainEvent({
      eventName: 'plan.created',
      payload: {
        planId: plan._id.toString(),
        traineeId: plan.traineeId.toString(),
        coachId: plan.coachId?.toString()
      }
    });

    return { plan: mapPlan(plan) };
  }

  async updatePlan(id: string, data: UpdatePlanDTO) {
    let validatedData;
    try {
      validatedData = await updatePlanSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.errors.join(', '));
    }

    const plan = await this.planModel.findById(id);
    if (!plan) {
      throw new DomainError('Plan not found');
    }

    // Verify authorization
    if (data.userId.toString() !== plan.traineeId.toString() && 
        data.userId.toString() !== plan.coachId?.toString()) {
      throw new DomainError('Not authorized to update this plan', 403);
    }

    // Update plan
    Object.assign(plan, validatedData);
    await plan.save();

    await this.eventService.publishDomainEvent({
      eventName: 'plan.updated',
      payload: {
        planId: plan._id.toString(),
        traineeId: plan.traineeId.toString(),
        coachId: plan.coachId?.toString()
      }
    });

    return { plan: mapPlan(plan) };
  }

  async deletePlan(id: string, userId: string) {
    const plan = await this.planModel.findById(id);
    if (!plan) {
      throw new DomainError('Plan not found');
    }

    // Verify authorization
    if (userId.toString() !== plan.traineeId.toString() && 
        userId.toString() !== plan.coachId?.toString()) {
      throw new DomainError('Not authorized to delete this plan');
    }

    await plan.deleteOne();

    await this.eventService.publishDomainEvent({
      eventName: 'plan.deleted',
      payload: {
        planId: id,
        traineeId: plan.traineeId.toString(),
        coachId: plan.coachId?.toString()
      }
    });

    return { success: true };
  }

  async scheduleWorkout(data: CreateScheduledPlanDTO) {
    let validatedData;
    try {
      validatedData = await createScheduledPlanSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.errors.join(', '));
    }

    // Get plan and verify it exists
    const plan = await this.planModel.findById(data.planId);
    if (!plan) {
      throw new DomainError('Plan not found');
    }

    // Check authorization
    if (data.userId !== plan.traineeId.toString() && 
        data.userId !== plan.coachId?.toString()) {
      throw new DomainError('Not authorized to schedule this plan');
    }

    // Use query service to check if plan is valid for the given date
    const scheduledDate = new Date(data.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);

    const plannedDates = await this.planningQueryService.getPlannedDates({
      traineeId: plan.traineeId.toString(),
      startDate: scheduledDate,
      endDate: scheduledDate,
      userId: data.userId,
      userRole: data.userRole
    });

    // Check if plan is available on the requested date
    const isValidDate = plannedDates.some(dateObj => 
      dateObj.plans.some(p => p._id === data.planId)
    );

    if (!isValidDate) {
      throw new DomainError('Plan is not available for the selected date');
    }

    // Create scheduled plan
    const scheduledPlan = await this.scheduledPlanModel.create({
      planId: plan._id,
      scheduledDate,
      scheduledBy: data.userId
    });

    await this.eventService.publishDomainEvent({
      eventName: 'plan.scheduled',
      payload: {
        scheduledPlanId: scheduledPlan._id.toString(),
        planId: plan._id.toString(),
        traineeId: plan.traineeId.toString(),
        coachId: plan.coachId?.toString(),
        scheduledDate: scheduledDate.toISOString()
      }
    });

    return { scheduledPlan: mapScheduledPlan(scheduledPlan) };
  }
} 