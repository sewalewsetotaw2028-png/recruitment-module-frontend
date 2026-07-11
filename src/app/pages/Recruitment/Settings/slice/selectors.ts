import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { recruitmentSettings?: typeof initialState }).recruitmentSettings ??
  initialState;

export const selectRecruitmentSettingsLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectRecruitmentSettingsError = createSelector(
  [selectDomain],
  (s) => s.error,
);
