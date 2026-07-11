import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { candidateApplications?: typeof initialState })
    .candidateApplications ?? initialState;

export const selectCandidateApplications = createSelector(
  [selectDomain],
  (s) => s.applications,
);

export const selectCandidateApplicationsInterviews = createSelector(
  [selectDomain],
  (s) => s.interviews,
);

export const selectCandidateApplicationsLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectCandidateApplicationsError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectCandidateApplicationsActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);

export const selectCandidateApplicationsActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);
