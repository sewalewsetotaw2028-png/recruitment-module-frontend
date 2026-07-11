import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { workforcePlanningSaga } from './saga';
import type { WorkforcePlanningState } from './types';
import type { WorkforcePlan } from '@/types';

export const initialState: WorkforcePlanningState = {
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionSuccess: null,
  workforcePlans: [],
  departments: [],
};

const slice = createSlice({
  name: 'workforcePlanning',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
    fetchWorkforcePlanningDataRequest(state) {
      state.loading = true;
      state.error = null;
      state.actionSuccess = null;
    },
    fetchWorkforcePlanningDataSuccess(
      state,
      action: PayloadAction<{
        workforcePlans: WorkforcePlan[];
        departments: Array<{ id: string; name: string }>;
      }>,
    ) {
      state.loading = false;
      state.workforcePlans = action.payload.workforcePlans;
      state.departments = action.payload.departments;
    },
    fetchWorkforcePlanningDataFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    submitWorkforcePlanRequest(
      state,
      action: PayloadAction<{ planId: string; successMessage: string }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    submitWorkforcePlanSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    submitWorkforcePlanFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    forwardWorkforcePlanToCeoRequest(
      state,
      _action: PayloadAction<{
        planId: string;
        notes?: string;
        successMessage: string;
      }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    forwardWorkforcePlanToCeoSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    forwardWorkforcePlanToCeoFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    returnWorkforcePlanForRevisionRequest(
      state,
      _action: PayloadAction<{
        planId: string;
        reason: string;
        successMessage: string;
      }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    returnWorkforcePlanForRevisionSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    returnWorkforcePlanForRevisionFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    approveWorkforcePlanRequest(
      state,
      action: PayloadAction<{ planId: string; successMessage: string }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    approveWorkforcePlanSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    approveWorkforcePlanFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    rejectWorkforcePlanRequest(
      state,
      action: PayloadAction<{
        planId: string;
        reason: string;
        successMessage: string;
      }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    rejectWorkforcePlanSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    rejectWorkforcePlanFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    clearActionStatus(state) {
      state.actionLoading = false;
      state.actionError = null;
      state.actionSuccess = null;
    },
  },
});

export const workforcePlanningActions = slice.actions;

export const useWorkforcePlanningSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: workforcePlanningSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
