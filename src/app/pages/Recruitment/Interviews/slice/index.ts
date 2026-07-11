import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { interviewsSaga } from './saga';
import type { InterviewsState, ScheduleInterviewRequest, RescheduleInterviewRequest } from './types';

export const initialState: InterviewsState = {
  loading: false,
  error: null,
  interviews: [],
  actionSuccess: null,
  actionError: null,
  actionLoading: false,
};

const slice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    fetchInterviewsRequest(state) {
      state.loading = true;
      state.error = null;
      state.actionSuccess = null;
      state.actionError = null;
    },
    fetchInterviewsSuccess(state, action) {
      state.loading = false;
      state.interviews = action.payload;
    },
    fetchInterviewsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    scheduleInterviewRequest(state, _action: PayloadAction<ScheduleInterviewRequest>) {
      state.actionLoading = true;
      state.actionSuccess = null;
      state.actionError = null;
    },
    scheduleInterviewSuccess(state, action) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    scheduleInterviewFailure(state, action) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    rescheduleInterviewRequest(state, _action: PayloadAction<RescheduleInterviewRequest>) {
      state.actionLoading = true;
      state.actionSuccess = null;
      state.actionError = null;
    },
    rescheduleInterviewSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    rescheduleInterviewFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    cancelInterviewRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
      state.actionSuccess = null;
      state.actionError = null;
    },
    cancelInterviewSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    cancelInterviewFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    clearActionState(state) {
      state.actionSuccess = null;
      state.actionError = null;
      state.actionLoading = false;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const interviewsActions = slice.actions;

export const useInterviewsSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: interviewsSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
