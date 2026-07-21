import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { talentPool?: typeof initialState }).talentPool ??
  initialState;

export const selectTalentPoolLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectTalentPoolError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectTalentPoolEntries = createSelector(
  [selectDomain],
  (s) => s.entries,
);

export const selectTalentPoolLinking = createSelector(
  [selectDomain],
  (s) => s.linking,
);

export const selectRosterHistory = createSelector(
  [selectDomain],
  (s) => s.history,
);

export const selectRosterHistoryLoading = createSelector(
  [selectDomain],
  (s) => s.historyLoading,
);

export const selectLastLinkedRosterId = createSelector(
  [selectDomain],
  (s) => s.lastLinkedRosterId,
);

export const selectInterviewScheduling = createSelector(
  [selectDomain],
  (s) => s.interviewScheduling,
);

export const selectInterviewSuccess = createSelector(
  [selectDomain],
  (s) => s.interviewSuccess,
);

export const selectInterviewError = createSelector(
  [selectDomain],
  (s) => s.interviewError,
);
