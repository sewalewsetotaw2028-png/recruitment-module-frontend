import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { recruitmentRequestsSaga } from './saga';
import type { RecruitmentRequestsState } from './types';
import type { RecruitmentRequest } from '@/types';
import type { RecruitmentRequestPayload } from '../api';

export const initialState: RecruitmentRequestsState = {
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionSuccess: null,
  requests: [],
  departments: [],
  lastCreatedRequestId: null,
};

const slice = createSlice({
  name: 'recruitmentRequests',
  initialState,
  reducers: {
    fetchRequestsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchRequestsSuccess(
      state,
      action: PayloadAction<{
        requests: RecruitmentRequest[];
        departments: Array<{ id: string; name: string }>;
      }>,
    ) {
      state.loading = false;
      state.requests = action.payload.requests;
      state.departments = action.payload.departments;
    },
    fetchRequestsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createRequestRequest(
      state,
      _action: PayloadAction<{ data: RecruitmentRequestPayload; status: 'draft' | 'submitted' }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    createRequestSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
      // payload is "requestId:message" — e.g. "abc-123:Request created."
      const [id] = action.payload.split(':');
      state.lastCreatedRequestId = id || null;
    },
    createRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    updateRequestRequest(
      state,
      _action: PayloadAction<{ requestId: string; data: RecruitmentRequestPayload }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    updateRequestSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    updateRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    hrReviewRequestRequest(
      state,
      _action: PayloadAction<{
        requestId: string;
        action: 'approve' | 'reject';
        notes?: string;
      }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    hrReviewRequestSuccess(
      state,
      action: PayloadAction<string>,
    ) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    hrReviewRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    approveRequestRequest(state, _action: PayloadAction<{ requestId: string }>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    approveRequestSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    approveRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    rejectRequestRequest(
      state,
      _action: PayloadAction<{ requestId: string; reason: string }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    rejectRequestSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    rejectRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    submitRequestRequest(state, _action: PayloadAction<{ requestId: string }>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    submitRequestSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    submitRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    deleteRequestRequest(state, _action: PayloadAction<{ requestId: string }>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    deleteRequestSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    deleteRequestFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    clearActionState(state) {
      state.actionError = null;
      state.actionSuccess = null;
    },
  },
});

export const recruitmentRequestsActions = slice.actions;

export const useRecruitmentRequestsSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: recruitmentRequestsSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
