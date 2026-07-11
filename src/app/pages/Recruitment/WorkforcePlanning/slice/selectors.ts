import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { workforcePlanning?: typeof initialState })
    .workforcePlanning ?? initialState;

export const selectWorkforcePlanningLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectWorkforcePlanningError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectWorkforcePlanningActionLoading = createSelector(
  [selectDomain],
  (s) => s.actionLoading,
);

export const selectWorkforcePlanningActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);

export const selectWorkforcePlanningActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);

export const selectWorkforcePlanningDepartments = createSelector(
  [selectDomain],
  (s) => s.departments,
);

export const selectWorkforcePlanningPlans = createSelector(
  [selectDomain],
  (s) => s.workforcePlans,
);
