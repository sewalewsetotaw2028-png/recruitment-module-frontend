import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import type { RecruitmentDashboardStats } from './types';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { recruitmentDashboard?: typeof initialState })
    .recruitmentDashboard ?? initialState;

export const selectRecruitmentDashboardLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectRecruitmentDashboardError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectRecruitmentDashboardSummary = createSelector(
  [selectDomain],
  (s) => s.summary,
);

export const selectRecruitmentDashboardPipeline = createSelector(
  [selectDomain],
  (s) => s.pipeline,
);

export const selectRecruitmentDashboardKpis = createSelector(
  [selectDomain],
  (s) => (s as any).kpis,
);

export const selectRecruitmentDashboardSourcing = createSelector(
  [selectDomain],
  (s) => (s as any).sourcing as RecruitmentDashboardStats['sourcing'],
);

export const selectRecruitmentDashboardTrends = createSelector(
  [selectDomain],
  (s) => (s as any).trends as RecruitmentDashboardStats['trends'],
);

export const selectRecruitmentDashboardLastFetchedAt = createSelector(
  [selectDomain],
  (s) => (s as any).lastFetchedAt as number | undefined,
);
