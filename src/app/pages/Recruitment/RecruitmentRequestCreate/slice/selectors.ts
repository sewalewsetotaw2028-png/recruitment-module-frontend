import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { recruitmentRequestCreate?: typeof initialState }).recruitmentRequestCreate ??
  initialState;

export const selectRecruitmentRequestCreateLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectRecruitmentRequestCreateError = createSelector(
  [selectDomain],
  (s) => s.error,
);
