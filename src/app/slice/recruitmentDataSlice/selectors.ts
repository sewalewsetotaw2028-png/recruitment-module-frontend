import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectRecruitmentDataDomain = (state: RootState) =>
  (state as RootState & { recruitmentData?: typeof initialState })
    .recruitmentData ?? initialState;

export const selectWorkforcePlans = createSelector(
  [selectRecruitmentDataDomain],
  (data) => data.workforcePlans,
);

export const selectRecruitmentRequests = createSelector(
  [selectRecruitmentDataDomain],
  (data) => data.recruitmentRequests,
);

export const selectUsingMockData = createSelector(
  [selectRecruitmentDataDomain],
  (data) => data.usingMockData,
);
