export const TransportRoutes = {
  Exercise: {
    CREATE: 'exercise.create',
    UPDATE: 'exercise.update',
    UPDATE_WITH_KPIS: 'exercise.updateWithKPIs',
    DELETE: 'exercise.delete',
    GET_ALL: 'exercises.get',
    GET_BY_IDS: 'exercises.getByIds',
    GET_BY_ID: 'exercise.getById'
  },
  Template: {
    CREATE: 'template.create',
    UPDATE: 'template.update',
    DELETE: 'template.delete',
    GET_ALL: 'templates.get',
    GET_BY_ID: 'template.getById'
  },
  KPI: {
    UPDATE: 'kpi.update'
  },
  Resource: {
    SHARE: 'resource.share',
    DELETE: 'resource.delete',
    GET_SHARES: 'resource.getShares'
  },
  Auth: {
    REGISTER: 'auth.register',
    LOGIN: 'auth.login',
    GET_TRAINEES_BY_COACH: 'auth.coach.trainees',
    GET_COACH_BY_TRAINEE: 'auth.trainee.coach',
    ADD_TRAINEE: 'auth.coach.addTrainee',
    REMOVE_TRAINEE: 'auth.coach.removeTrainee',
    CHECK_COACH_TRAINEE: 'auth.checkCoachTrainee',
    GET_USERS: 'auth.users'
  }
} as const; 