import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { shortlisted?: typeof initialState }).shortlisted ??
  initialState;

export const selectShortlistedLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectShortlistedError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectShortlistedApplications = createSelector(
  [selectDomain],
  (s) => s.applications,
);
