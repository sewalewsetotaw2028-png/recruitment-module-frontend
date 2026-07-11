import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { questionBank?: typeof initialState }).questionBank ??
  initialState;

export const selectQuestionBankLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectQuestionBankError = createSelector(
  [selectDomain],
  (s) => s.error,
);
