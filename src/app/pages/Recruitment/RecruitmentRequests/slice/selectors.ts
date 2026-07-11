import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import type { RecruitmentRequest } from '@/types';
import type { RecruitmentRequestsState } from './types';

const initialState: RecruitmentRequestsState = {
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionSuccess: null,
  requests: [],
  departments: [],
  lastCreatedRequestId: null,
};

const selectDomain = (state: RootState) =>
  (state as RootState & { recruitmentRequests?: RecruitmentRequestsState })
    .recruitmentRequests ?? initialState;

export const selectRecruitmentRequests = createSelector(
  [selectDomain],
  (s): RecruitmentRequest[] => s.requests,
);

export const selectRecruitmentRequestsLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectRecruitmentRequestsError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectRecruitmentRequestsActionLoading = createSelector(
  [selectDomain],
  (s) => s.actionLoading,
);

export const selectRecruitmentRequestsActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);

export const selectRecruitmentRequestsActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);

export const selectRecruitmentRequestsDepartments = createSelector(
  [selectDomain],
  (s) => s.departments,
);

export const selectLastCreatedRequestId = createSelector(
  [selectDomain],
  (s) => s.lastCreatedRequestId,
);
