// Role constants
export const ROLES = {
  CANDIDATE: 'candidate',
  HR: 'hr',
  CEO: 'ceo',
  HIRING_MANAGER: 'hiring_manager',
  DEPARTMENT_MANAGER: 'department_manager',
  APPLICANT: 'applicant',
} as const;

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  candidate: 'Candidate',
  hr: 'HR Recruiter',
  ceo: 'CEO',
  hiring_manager: 'Hiring Manager',
  department_manager: 'Department Manager',
  applicant: 'Applicant',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  candidate: ['view_vacancies', 'apply_jobs', 'view_applications'],
  hr: ['manage_vacancies', 'screen_candidates', 'schedule_interviews', 'manage_offers'],
  ceo: ['approve_plans', 'approve_requests', 'approve_offers', 'view_analytics'],
  hiring_manager: ['view_candidates', 'submit_requests', 'evaluate_interviews'],
  department_manager: ['view_department_plans', 'submit_department_requests'],
  applicant: ['view_vacancies', 'apply_jobs'],
};
