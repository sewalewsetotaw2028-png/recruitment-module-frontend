import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { interviews?: typeof initialState }).interviews ??
  initialState;

export const selectInterviews = createSelector(
  [selectDomain],
  (s) => s.interviews,
);

export const selectInterviewsLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectInterviewsError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectInterviewsActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);

export const selectInterviewsActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);
