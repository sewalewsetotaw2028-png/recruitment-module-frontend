import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { authenticationLogin?: typeof initialState })
    .authenticationLogin ?? initialState;

export const selectLoginSubmitting = createSelector(
  [selectDomain],
  (s) => s.submitting,
);

export const selectLoginPageError = createSelector(
  [selectDomain],
  (s) => s.error,
);
