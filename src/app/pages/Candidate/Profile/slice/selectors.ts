import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { candidateProfile?: typeof initialState }).candidateProfile ??
  initialState;

export const selectCandidateProfile = createSelector(
  [selectDomain],
  (s) => s.profile,
);

export const selectCandidateProfileLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectCandidateProfileError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectCandidateProfileActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);

export const selectCandidateProfileActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);
