/** BRD functional requirement registry — used for demo / Figma traceability */

export interface FrEntry {
  id: string;
  title: string;
  module: string;
}

export const FR_BY_SCREEN: Record<string, FrEntry[]> = {
  'candidate-onboarding': [
    { id: 'FR-21', title: 'Candidate Registration', module: 'Candidate Management' },
    { id: 'FR-23', title: 'Document Management', module: 'Candidate Management' },
    { id: 'FR-25', title: 'Duplicate Prevention', module: 'Candidate Management' },
  ],
  'candidate-dashboard': [
    { id: 'FR-24', title: 'Application Tracking', module: 'Candidate Management' },
    { id: 'FR-75', title: 'Candidate Stage Notifications', module: 'Notifications' },
  ],
  'candidate-profile': [
    { id: 'FR-21', title: 'Candidate Profile', module: 'Candidate Management' },
    { id: 'FR-23', title: 'Document Management', module: 'Candidate Management' },
  ],
  'candidate-jobs': [
    { id: 'FR-21', title: 'Posting Information (public view)', module: 'Job Posting' },
    { id: 'FR-22', title: 'Application Submission', module: 'Candidate Management' },
    { id: 'FR-56', title: 'Source Tracking', module: 'Reporting' },
  ],
  'hr-dashboard': [
    { id: 'FR-15', title: 'Vacancy Dashboard', module: 'Vacancy Management' },
    { id: 'FR-63', title: 'Recruitment Dashboard', module: 'Reporting' },
  ],
  'hr-vacancies': [
    { id: 'FR-13', title: 'Vacancy Creation', module: 'Vacancy Management' },
    { id: 'FR-14', title: 'Vacancy Status', module: 'Vacancy Management' },
    { id: 'FR-15', title: 'Vacancy Dashboard', module: 'Vacancy Management' },
    { id: 'FR-16', title: 'Vacancy History', module: 'Vacancy Management' },
    { id: 'FR-17', title: 'Job Description Management', module: 'Job Posting' },
    { id: 'FR-18', title: 'Job Posting Control', module: 'Job Posting' },
    { id: 'FR-19', title: 'Posting Channels', module: 'Job Posting' },
    { id: 'FR-20', title: 'Publishing Authority', module: 'Job Posting' },
    { id: 'FR-21', title: 'Posting Information', module: 'Job Posting' },
  ],
  'hr-screening': [
    { id: 'FR-26', title: 'Screening Process', module: 'Screening' },
    { id: 'FR-27', title: 'Screening Criteria', module: 'Screening' },
    { id: 'FR-28', title: 'Shortlisting', module: 'Screening' },
    { id: 'FR-29', title: 'Rejection Management', module: 'Screening' },
    { id: 'FR-30', title: 'Evaluation Notes', module: 'Screening' },
    { id: 'FR-50', title: 'Talent Roster Module', module: 'Talent Pool' },
  ],
  'hr-kanban': [
    { id: 'FR-65', title: 'Pipeline Reporting', module: 'Reporting' },
    { id: 'FR-61', title: 'Candidate Conversion Metrics', module: 'Reporting' },
  ],
  'hr-interviews': [
    { id: 'FR-31', title: 'Interview Scheduling', module: 'Interviews' },
    { id: 'FR-32', title: 'Panel Management', module: 'Interviews' },
    { id: 'FR-33', title: 'Interview Modes', module: 'Interviews' },
    { id: 'FR-34', title: 'Calendar Coordination', module: 'Interviews' },
    { id: 'FR-35', title: 'Rescheduling Control', module: 'Interviews' },
    { id: 'FR-36', title: 'Interview Questions', module: 'Interviews' },
    { id: 'FR-37', title: 'Question Generation', module: 'Interviews' },
  ],
  'hr-offers': [
    { id: 'FR-45', title: 'HRIS Integration', module: 'Offer & Onboarding' },
    { id: 'FR-46', title: 'Offer Generation', module: 'Offer & Onboarding' },
    { id: 'FR-47', title: 'Status Synchronization', module: 'Offer & Onboarding' },
    { id: 'FR-48', title: 'Onboarding Trigger', module: 'Offer & Onboarding' },
    { id: 'FR-49', title: 'Standalone / Manual Onboarding', module: 'Offer & Onboarding' },
  ],
  'hr-roster': [
    { id: 'FR-50', title: 'Talent Roster Module', module: 'Talent Pool' },
    { id: 'FR-51', title: 'Movement to Pool', module: 'Talent Pool' },
    { id: 'FR-52', title: 'Candidate Reuse', module: 'Talent Pool' },
    { id: 'FR-53', title: 'Candidate History', module: 'Talent Pool' },
    { id: 'FR-54', title: 'Pool Search and Filtering', module: 'Talent Pool' },
    { id: 'FR-55', title: 'Vacancy Application from Roster', module: 'Talent Pool' },
  ],
  'hr-settings': [
    { id: 'FR-68', title: 'Company Profile Configuration', module: 'Configuration' },
    { id: 'FR-72', title: 'Workflow Configuration', module: 'Configuration' },
    { id: 'FR-73', title: 'Role Configuration', module: 'Configuration' },
    { id: 'FR-74', title: 'Job Template Configuration', module: 'Configuration' },
    { id: 'FR-80', title: 'Notification History', module: 'Notifications' },
  ],
  'ceo-dashboard': [
    { id: 'FR-63', title: 'Recruitment Dashboard', module: 'Reporting' },
    { id: 'FR-59', title: 'Cycle Time Metrics', module: 'Reporting' },
    { id: 'FR-60', title: 'Vacancy Fulfillment Metrics', module: 'Reporting' },
  ],
  'ceo-planning': [
    { id: 'FR-01', title: 'Workforce Plan Creation', module: 'Workforce Planning' },
    { id: 'FR-02', title: 'Planning Structure', module: 'Workforce Planning' },
    { id: 'FR-03', title: 'Headcount Definition', module: 'Workforce Planning' },
    { id: 'FR-04', title: 'Justification', module: 'Workforce Planning' },
    { id: 'FR-05', title: 'Draft Management', module: 'Workforce Planning' },
    { id: 'FR-06', title: 'Version Control', module: 'Workforce Planning' },
    { id: 'FR-07', title: 'Quarterly Planning Cadence', module: 'Workforce Planning' },
    { id: 'FR-08', title: 'Submission', module: 'Workforce Planning' },
  ],
  'hr-planning': [
    { id: 'FR-01', title: 'Workforce Plan Creation', module: 'Workforce Planning' },
    { id: 'FR-02', title: 'Planning Structure', module: 'Workforce Planning' },
    { id: 'FR-03', title: 'Headcount Definition', module: 'Workforce Planning' },
    { id: 'FR-04', title: 'Justification', module: 'Workforce Planning' },
    { id: 'FR-05', title: 'Draft Management', module: 'Workforce Planning' },
    { id: 'FR-06', title: 'Version Control', module: 'Workforce Planning' },
    { id: 'FR-07', title: 'Quarterly Planning Cadence', module: 'Workforce Planning' },
    { id: 'FR-08', title: 'Submission & HR Review', module: 'Workforce Planning' },
  ],
  'ceo-requisitions': [
    { id: 'FR-08', title: 'Request Creation', module: 'Recruitment Requests' },
    { id: 'FR-09', title: 'Classification', module: 'Recruitment Requests' },
    { id: 'FR-10', title: 'Justification', module: 'Recruitment Requests' },
    { id: 'FR-11', title: 'Job Information', module: 'Recruitment Requests' },
    { id: 'FR-12', title: 'Replacement Hiring', module: 'Recruitment Requests' },
  ],
  'hr-requisitions': [
    { id: 'FR-08', title: 'Request Creation & List', module: 'Recruitment Requests' },
    { id: 'FR-09', title: 'Classification', module: 'Recruitment Requests' },
    { id: 'FR-10', title: 'Justification', module: 'Recruitment Requests' },
    { id: 'FR-11', title: 'Job Information', module: 'Recruitment Requests' },
    { id: 'FR-12', title: 'Replacement Hiring', module: 'Recruitment Requests' },
  ],
  'ceo-offers': [
    { id: 'FR-45', title: 'HRIS Integration', module: 'Offer & Onboarding' },
    { id: 'FR-57', title: 'Hiring Minute Generation', module: 'Reporting' },
  ],
  'hm-dashboard': [
    { id: 'FR-38', title: 'Evaluation Forms', module: 'Interview Evaluation' },
    { id: 'FR-39', title: 'Scoring Mechanism', module: 'Interview Evaluation' },
    { id: 'FR-40', title: 'Interview Outcome', module: 'Interview Evaluation' },
  ],
  'hm-requisitions': [
    { id: 'FR-08', title: 'Request Creation', module: 'Recruitment Requests' },
    { id: 'FR-09', title: 'Classification', module: 'Recruitment Requests' },
    { id: 'FR-10', title: 'Justification', module: 'Recruitment Requests' },
    { id: 'FR-11', title: 'Job Information', module: 'Recruitment Requests' },
    { id: 'FR-12', title: 'Replacement Hiring', module: 'Recruitment Requests' },
  ],
  'hm-questions': [
    { id: 'FR-36', title: 'Interview Question Management', module: 'Interviews' },
    { id: 'FR-74', title: 'Job Template Configuration', module: 'Configuration' },
  ],
};

export function getFrForScreen(screenKey: string): FrEntry[] {
  return FR_BY_SCREEN[screenKey] || [];
}
