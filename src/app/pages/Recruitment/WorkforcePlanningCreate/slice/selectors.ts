import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { workforcePlanningCreate?: typeof initialState })
    .workforcePlanningCreate ?? initialState;

export const selectWorkforcePlanningCreateLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectWorkforcePlanningCreateError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectWorkforcePlanningCreateDepartments = createSelector(
  [selectDomain],
  (s) => s.departments,
);

export const selectWorkforcePlanningCreateSuccess = createSelector(
  [selectDomain],
  (s) => s.success,
);
