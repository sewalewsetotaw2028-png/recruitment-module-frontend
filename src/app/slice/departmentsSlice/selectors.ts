import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { departments?: typeof initialState }).departments ??
  initialState;

export const selectDepartmentsLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);
export const selectDepartmentsError = createSelector(
  [selectDomain],
  (s) => s.error,
);
export const selectDepartments = createSelector(
  [selectDomain],
  (s) => s.departments,
);
