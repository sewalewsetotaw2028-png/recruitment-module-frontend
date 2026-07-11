/** Central API route paths — keep in sync with recruitment-module-backend/src/app.ts mounts */
const API_V1 = '/api/v1';

export const API_ROUTES = {

  auth: {

    login: `${API_V1}/auth/login`,

    register: `${API_V1}/auth/register`,

    me: `${API_V1}/auth/me`,

    logout: `${API_V1}/auth/logout`,

    refresh: `${API_V1}/auth/refresh`,

  },

  candidates: {

    register: `${API_V1}/candidates/register`,

    login: `${API_V1}/candidates/login`,

    me: `${API_V1}/candidates/me`,

    profile: `${API_V1}/candidates/profile`,

    applications: `${API_V1}/candidates/applications`,

    screeningApplications: `${API_V1}/candidates/screening/applications`,
    shortlistedApplications: `${API_V1}/candidates/shortlisted`,

    apply: `${API_V1}/candidates/apply`,

    offers: `${API_V1}/candidates/offers`,

    acceptOffer: (offerId: string) => `${API_V1}/candidates/offers/${offerId}/accept`,

    rejectOffer: (offerId: string) => `${API_V1}/candidates/offers/${offerId}/reject`,

    vacancies: (companyId: string) => `${API_V1}/candidates/vacancies/${companyId}`,

    vacanciesAuth: `${API_V1}/candidates/vacancies`,

    vacancyDetail: (id: string) => `${API_V1}/candidates/vacancies-detail/${id}`,

    documents: `${API_V1}/candidates/documents`,

    document: (documentId: string) => `${API_V1}/candidates/documents?documentId=${encodeURIComponent(documentId)}`,

    experience: `${API_V1}/candidates/experience`,

    experienceById: (id: string) => `${API_V1}/candidates/experience/${id}`,

    education: `${API_V1}/candidates/education`,

    educationById: (id: string) => `${API_V1}/candidates/education/${id}`,

    interviews: `${API_V1}/candidates/interviews`,

    completeness: `${API_V1}/candidates/me/completeness`,

    notifications: `${API_V1}/candidates/me/notifications`,

    markNotificationRead: (id: string) => `${API_V1}/candidates/me/notifications/${id}/read`,

    markAllNotificationsRead: `${API_V1}/candidates/me/notifications/read-all`,

    changePassword: `${API_V1}/candidates/change-password`,

    avatar: `${API_V1}/candidates/avatar`,

    certification: `${API_V1}/candidates/certification`,

    certificationById: (id: string) => `${API_V1}/candidates/certification/${id}`,

    phone: `${API_V1}/candidates/phone`,

    phoneById: (id: string) => `${API_V1}/candidates/phone/${id}`,

    address: `${API_V1}/candidates/address`,

    addressById: (id: string) => `${API_V1}/candidates/address/${id}`,

    talentRoster: `${API_V1}/candidates/talent-roster`,

    recruitmentSources: `${API_V1}/candidates/recruitment-sources`,

  },

  workforce: {

    departments: `${API_V1}/workforce/departments`,

    plans: `${API_V1}/workforce/plans`,

    plan: (planId: string) => `${API_V1}/workforce/plans/${planId}`,

    submitPlan: (planId: string) => `${API_V1}/workforce/plans/${planId}/submit`,

    forwardPlan: (planId: string) => `${API_V1}/workforce/plans/${planId}/forward`,

    returnPlan: (planId: string) => `${API_V1}/workforce/plans/${planId}/return`,

    approvePlan: (planId: string) => `${API_V1}/workforce/plans/${planId}/approve`,

    rejectPlan: (planId: string) => `${API_V1}/workforce/plans/${planId}/reject`,

  },

  recruitment: {

    requests: `${API_V1}/recruitment/requests`,

    request: (requestId: string) => `${API_V1}/recruitment/requests/${requestId}`,

    uploadDocument: (requestId: string) => `${API_V1}/recruitment/requests/${requestId}/document`,
    document: (requestId: string) => `${API_V1}/recruitment/requests/${requestId}/document`,

    reviewRequest: (requestId: string) =>

      `${API_V1}/recruitment/requests/${requestId}/review`,

    approveRequest: (requestId: string) =>

      `${API_V1}/recruitment/requests/${requestId}/approve`,

    rejectRequest: (requestId: string) =>

      `${API_V1}/recruitment/requests/${requestId}/reject`,

    vacancies: `${API_V1}/vacancies`,

    vacancy: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}`,

    postVacancy: (vacancyId: string) =>

      `${API_V1}/vacancies/${vacancyId}/post`,

    unpostVacancy: (vacancyId: string) =>

      `${API_V1}/vacancies/${vacancyId}/unpost`,

    closeVacancy: (vacancyId: string) =>

      `${API_V1}/vacancies/${vacancyId}/close`,

  },

  vacancies: {

    list: `${API_V1}/vacancies`,

    byId: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}`,

    post: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}/post`,

    unpost: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}/unpost`,

    hold: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}/hold`,

    resume: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}/resume`,

    setStatus: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}/status`,

    close: (vacancyId: string) => `${API_V1}/vacancies/${vacancyId}/fulfill`,

    approvePosting: (vacancyId: string) =>

      `${API_V1}/vacancies/${vacancyId}/approve-posting`,

    rejectPosting: (vacancyId: string) =>

      `${API_V1}/vacancies/${vacancyId}/reject-posting`,

  },

  interviews: {

    list: `${API_V1}/interviews/list`,

    applicationStatus: `${API_V1}/interviews/application-status`,

    schedule: `${API_V1}/interviews/schedule`,

    evaluate: `${API_V1}/interviews/evaluate`,

    create: `${API_V1}/interviews`,

    questionBank: `${API_V1}/interviews/question-bank`,
    generateQuestions: `${API_V1}/interviews/generate-questions`,

    byId: (interviewId: string) => `${API_V1}/interviews/${interviewId}`,

    cancel: (interviewId: string) => `${API_V1}/interviews/${interviewId}/cancel`,

    evaluations: (interviewId: string) =>

      `${API_V1}/interviews/${interviewId}/evaluations`,

  },

  offers: {

    list: `${API_V1}/offers`,

    issue: `${API_V1}/offers/issue`,

    accept: (offerId: string) => `${API_V1}/offers/${offerId}/accept`,

    reject: (offerId: string) => `${API_V1}/offers/${offerId}/reject`,

  },

  roaster: {

    list: `${API_V1}/roaster`,

  },

  jobPostings: {

    list: `${API_V1}/job-postings`,

    channels: `${API_V1}/job-postings/channels`,

    byVacancy: (vacancyId: string) => `${API_V1}/job-postings?vacancyId=${vacancyId}`,

    byId: (id: string) => `${API_V1}/job-postings/${id}`,

    publish: (id: string) => `${API_V1}/job-postings/${id}/publish`,

    withdraw: (vacancyId: string) => `${API_V1}/job-postings/${vacancyId}/withdraw`,


    withdraw: (id: string) => `${API_V1}/job-postings/${id}/withdraw`,


    delete: (id: string) => `${API_V1}/job-postings/${id}`,

  },

  users: {
    list: `${API_V1}/users`,
    byRole: (role: string) => `${API_V1}/users?role=${encodeURIComponent(role)}`,
    hiringManagers: `${API_V1}/users?role=hiring_manager`,
  },

  reporting: {

    dashboard: `${API_V1}/reporting/dashboard`,

    hiringMinute: (vacancyId: string) => `${API_V1}/reporting/hiring-minute/${vacancyId}`,

    myVacancies: `${API_V1}/reporting/my-vacancies`,

    myInterviews: `${API_V1}/reporting/my-interviews`,

    myEvaluations: `${API_V1}/reporting/my-evaluations`,

  },

  config: {

    roles: `${API_V1}/config/roles`,

    roleById: (id: string) => `${API_V1}/config/roles/${id}`,

    rolePermissions: (id: string) => `${API_V1}/config/roles/${id}/permissions`,

    permissions: `${API_V1}/config/permissions`,

    userRoles: (userId: string) => `${API_V1}/config/users/${userId}/roles`,

    users: `${API_V1}/config/users`,

    user: (userId: string) => `${API_V1}/config/users/${userId}`,

    screeningCriteria: `${API_V1}/config/screening-criteria`,

    screeningCriteriaByVacancy: (vacancyId: string) =>

      `${API_V1}/config/screening-criteria/vacancy/${vacancyId}`,

    screeningCriteriaById: (id: string) => `${API_V1}/config/screening-criteria/${id}`,

    evaluationTemplates: `${API_V1}/config/evaluation-templates`,

    evaluationTemplateById: (id: string) => `${API_V1}/config/evaluation-templates/${id}`,

    evaluationTemplateCriteriaById: (id: string) =>

      `${API_V1}/config/evaluation-templates/${id}/criteria`,

    notificationTemplates: `${API_V1}/config/notification-templates`,

    notificationTemplateById: (id: string) => `${API_V1}/config/notification-templates/${id}`,

    notificationTemplateByType: (type: string) =>

      `${API_V1}/config/notification-templates/${type}`,

    notificationTemplatePreviewByType: (type: string) =>

      `${API_V1}/config/notification-templates/${type}/preview`,

    notificationVariables: `${API_V1}/config/notification-variables`,

    notificationVariablesByType: (type: string) =>

      `${API_V1}/config/notification-variables/${type}`,

    recruitmentChannels: `${API_V1}/config/recruitment-channels`,

    recruitmentChannelById: (id: string) => `${API_V1}/config/recruitment-channels/${id}`,

    recruitmentSources: `${API_V1}/config/recruitment-sources`,

    recruitmentSourceById: (id: string) => `${API_V1}/config/recruitment-sources/${id}`,

    interviewCategories: `${API_V1}/config/interview-categories`,

    interviewCategoryById: (id: string) => `${API_V1}/config/interview-categories/${id}`,

  },

} as const;

