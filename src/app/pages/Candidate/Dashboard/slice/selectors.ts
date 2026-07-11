import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';
import type {
  CandidateDashboardApplication,
  CandidateDashboardInterview,
  CandidateDashboardOffer,
} from './types';

const selectDomain = (state: RootState) =>
  (state as RootState & { candidateDashboard?: typeof initialState })
    .candidateDashboard ?? initialState;

export const selectDashboardLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectDashboardError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectDashboardApplications = createSelector(
  [selectDomain],
  (s) => s.applications,
);

export const selectDashboardInterviews = createSelector(
  [selectDomain],
  (s) => s.interviews,
);

export const selectDashboardOffers = createSelector(
  [selectDomain],
  (s) => s.offers,
);

export const selectDashboardCompleteness = createSelector(
  [selectDomain],
  (s) => s.completeness,
);

export const selectDashboardSummary = createSelector(
  [selectDashboardApplications, selectDashboardInterviews, selectDashboardOffers, selectDashboardCompleteness],
  (applications, interviews, offers, completeness) => {
    const activeApplications = applications.filter(
      (a: CandidateDashboardApplication) =>
        !['rejected', 'hired', 'declined'].includes(a.currentStage.toLowerCase()) &&
        !['rejected', 'hired', 'declined'].includes(a.appliedAt?.toLowerCase() ?? ''),
    ).length;

    const scheduledInterviews = interviews.filter(
      (i: CandidateDashboardInterview) => i.interviewStatus === 'scheduled',
    ).length;

    const pendingOffers = offers.filter(
      (o: CandidateDashboardOffer) => o.status === 'SENT',
    ).length;

    const completenessPercentage = completeness?.percentage ?? 0;

    return {
      totalApplications: applications.length,
      activeApplications,
      scheduledInterviews,
      pendingOffers,
      completenessPercentage,
    };
  },
);
