import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { kanban?: typeof initialState }).kanban ??
  initialState;

export const selectKanbanLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectKanbanError = createSelector([selectDomain], (s) => s.error);

export const selectKanbanApplications = createSelector(
  [selectDomain],
  (s) => s.applications,
);
