// Route constants
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  LOGOUT: '/logout',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Workforce Planning
  WORKFORCE_PLANNING: '/workforce-planning',
  WORKFORCE_PLAN_CREATE: '/workforce-planning/create',
  WORKFORCE_PLAN_EDIT: '/workforce-planning/:id/edit',
  WORKFORCE_PLAN_VIEW: '/workforce-planning/:id',
  
  // Recruitment Requests
  RECRUITMENT_REQUESTS: '/recruitment-requests',
  RECRUITMENT_REQUEST_CREATE: '/recruitment-requests/create',
  RECRUITMENT_REQUEST_EDIT: '/recruitment-requests/:id/edit',
  RECRUITMENT_REQUEST_VIEW: '/recruitment-requests/:id',
  
  // Vacancies
  VACANCIES: '/vacancies',
  VACANCY_CREATE: '/vacancies/create',
  VACANCY_EDIT: '/vacancies/:id/edit',
  VACANCY_VIEW: '/vacancies/:id',
  
  // Candidates
  CANDIDATES: '/candidates',
  CANDIDATE_VIEW: '/candidates/:id',
  CANDIDATE_PROFILE: '/profile',
  
  // Screening
  SCREENING: '/screening',
  SHORTLISTED: '/shortlisted',
  
  // Interviews
  INTERVIEWS: '/interviews',
  INTERVIEW_CREATE: '/interviews/create',
  INTERVIEW_VIEW: '/interviews/:id',
  
  // Offers
  OFFERS: '/offers',
  OFFER_CREATE: '/offers/create',
  OFFER_VIEW: '/offers/:id',
  
  // Talent Pool
  TALENT_POOL: '/talent-pool',
  
  // Settings
  SETTINGS: '/settings',
} as const;
