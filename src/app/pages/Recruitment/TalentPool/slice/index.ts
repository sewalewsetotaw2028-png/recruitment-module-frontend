import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { talentPoolSaga } from './saga';
import type { TalentPoolState } from './types';

export const initialState: TalentPoolState = {
  loading: false,
  error: null,
  entries: [],
  linking: false,
  history: null,
  historyLoading: false,
  lastLinkedRosterId: null,
  interviewScheduling: false,
  interviewSuccess: null,
  interviewError: null,
};

const slice = createSlice({
  name: 'talentPool',
  initialState,
  reducers: {
    fetchTalentPoolRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchTalentPoolSuccess(state, action) {
      state.loading = false;
      state.entries = action.payload;
    },
    fetchTalentPoolFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    linkCandidateToVacancyRequest(state, _action: PayloadAction<{ rosterId: string; vacancyId: string }>) {
      state.linking = true;
      state.error = null;
    },
    linkCandidateToVacancySuccess(state, action: PayloadAction<{ result: any; rosterId: string }>) {
      state.linking = false;
      // Track which roster entry was just linked so the page can re-fetch history
      state.lastLinkedRosterId = action.payload.rosterId;
    },
    linkCandidateToVacancyFailure(state, action) {
      state.linking = false;
      state.error = action.payload;
    },
    getRosterHistoryRequest(state, _action: PayloadAction<string>) {
      state.historyLoading = true;
      state.error = null;
    },
    getRosterHistorySuccess(state, action) {
      state.historyLoading = false;
      state.history = action.payload;
    },
    getRosterHistoryFailure(state, action) {
      state.historyLoading = false;
      state.error = action.payload;
    },
    fetchAllRosterActivityRequest(state) {
      state.historyLoading = true;
      state.error = null;
    },
    fetchAllRosterActivitySuccess(state, action) {
      state.historyLoading = false;
      state.history = action.payload;
    },
    fetchAllRosterActivityFailure(state, action) {
      state.historyLoading = false;
      state.error = action.payload;
    },
    removeFromRosterRequest(state, _action: PayloadAction<{ rosterId: string; reason?: string }>) {
      state.loading = true;
      state.error = null;
    },
    removeFromRosterSuccess(state, action) {
      state.loading = false;
    },
    removeFromRosterFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    // Book Evaluation — schedules interview directly from roster via backend
    scheduleInterviewFromRosterRequest(
      state,
      _action: PayloadAction<{
        rosterId: string;
        vacancyId: string;
        type: 'physical' | 'virtual' | 'hybrid';
        startTime: string;
        endTime: string;
        location?: string;
        meetingLink?: string;
        panelIds: string[];
        questionTexts?: string[];
      }>,
    ) {
      state.interviewScheduling = true;
      state.interviewSuccess = null;
      state.interviewError = null;
    },
    scheduleInterviewFromRosterSuccess(state, action: PayloadAction<string>) {
      state.interviewScheduling = false;
      state.interviewSuccess = action.payload;
    },
    scheduleInterviewFromRosterFailure(state, action: PayloadAction<string>) {
      state.interviewScheduling = false;
      state.interviewError = action.payload;
    },
    clearInterviewState(state) {
      state.interviewScheduling = false;
      state.interviewSuccess = null;
      state.interviewError = null;
    },
    // Kept for backward compat — no-op now
    scheduleInterviewRequest(state) {},
    scheduleInterviewSuccess(state, _action) {},
    scheduleInterviewFailure(state, _action) {},
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const talentPoolActions = slice.actions;

export const useTalentPoolSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: talentPoolSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
