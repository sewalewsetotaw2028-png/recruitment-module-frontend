import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { offers?: typeof initialState }).offers ??
  initialState;

export const selectOffersLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectOffersError = createSelector(
  [selectDomain],
  (s) => s.error,
);
