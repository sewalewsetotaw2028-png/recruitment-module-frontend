import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { authenticationSignup?: typeof initialState })
    .authenticationSignup ?? initialState;

export const selectSignupSubmitting = createSelector(
  [selectDomain],
  (s) => s.submitting,
);

export const selectSignupPageError = createSelector(
  [selectDomain],
  (s) => s.error,
);
