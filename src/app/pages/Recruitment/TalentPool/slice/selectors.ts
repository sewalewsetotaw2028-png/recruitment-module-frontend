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
