// Feature flags configuration
export const featureFlags = {
  enableNewDashboard: import.meta.env.VITE_ENABLE_NEW_DASHBOARD === 'true',
  enableAdvancedScreening: import.meta.env.VITE_ENABLE_ADVANCED_SCREENING === 'true',
  enableInterviewGrading: import.meta.env.VITE_ENABLE_INTERVIEW_GRADING === 'true',
  enableTalentPool: import.meta.env.VITE_ENABLE_TALENT_POOL === 'true',
  enableVersionHistory: import.meta.env.VITE_ENABLE_VERSION_HISTORY === 'true',
};
