import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { workforcePlanningCreateSaga } from './saga';
import type { WorkforcePlanningCreateState } from './types';
import type { WorkforcePlanFormPayload } from '@/types';

export const initialState: WorkforcePlanningCreateState = {
  loading: false,
  error: null,
  departments: [],
  success: false,
  lastCreatedPlanId: null,
  createStatus: 'idle',
  currentPlanPayload: null,
};

const slice = createSlice({
  name: 'workforcePlanningCreate',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
    fetchDepartmentsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchDepartmentsSuccess(
      state,
      action: PayloadAction<Array<{ id: string; name: string }>>,
    ) {
      state.loading = false;
      state.departments = action.payload;
    },
    fetchDepartmentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createWorkforcePlanRequest(
      state,
      action: PayloadAction<{
        payload: WorkforcePlanFormPayload;
        status: 'draft' | 'submitted';
      }>,
    ) {
      state.loading = true;
      state.error = null;
      state.success = false;
      state.currentPlanPayload = action.payload.payload;
      state.createStatus = action.payload.status;
    },
    createWorkforcePlanSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.success = true;
      state.lastCreatedPlanId = action.payload;
      state.currentPlanPayload = null;
    },
    createWorkforcePlanFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
  },
});

export const workforcePlanningCreateActions = slice.actions;

export const useWorkforcePlanningCreateSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: workforcePlanningCreateSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
