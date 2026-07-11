import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { screening?: typeof initialState }).screening ??
  initialState;

export const selectScreeningLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectScreeningActionLoading = createSelector(
  [selectDomain],
  (s) => s.actionLoading,
);

export const selectScreeningError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectScreeningApplications = createSelector(
  [selectDomain],
  (s) => s.applications,
);

export const selectScreeningActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);

export const selectScreeningActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);
