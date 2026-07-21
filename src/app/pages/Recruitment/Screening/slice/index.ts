import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { screeningSaga } from './saga';
import type { ScreeningState } from './types';
import type { ScreeningCriterionResult } from '../api';

type UpdateApplicationStatusPayload = {
  applicationId: string;
  status: string;
  currentStage?: string;
  notes?: string;
  rejectionReason?: string;
  addToTalentRoster?: boolean;
  futureFitTag?: string;
  screeningCriteria?: ScreeningCriterionResult[];
};

export const initialState: ScreeningState = {
  loading: false,
  actionLoading: false,
  error: null,
  applications: [],
  actionSuccess: null,
  actionError: null,
};

const slice = createSlice({
  name: 'screening',
  initialState,
  reducers: {
    fetchScreeningRequest(state) {
      state.loading = true;
      state.error = null;
      state.actionSuccess = null;
      state.actionError = null;
    },
    fetchScreeningSuccess(state, action) {
      state.loading = false;
      state.applications = action.payload;
    },
    fetchScreeningFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    shortlistApplicationRequest(
      state,
      _action: PayloadAction<UpdateApplicationStatusPayload>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    shortlistApplicationSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.applications = state.applications.filter(
        (application) => application.id !== action.payload,
      );
      state.actionSuccess = `shortlist:${action.payload}`;
    },
    shortlistApplicationFailure(state, action) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    rejectApplicationRequest(
      state,
      _action: PayloadAction<UpdateApplicationStatusPayload>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    rejectApplicationSuccess(
      state,
      action: PayloadAction<{
        applicationId: string;
        addToTalentRoster?: boolean;
      }>,
    ) {
      state.actionLoading = false;
      state.applications = state.applications.filter(
        (application) => application.id !== action.payload.applicationId,
      );
      state.actionSuccess = action.payload.addToTalentRoster
        ? `talentpool:${action.payload.applicationId}`
        : `reject:${action.payload.applicationId}`;
    },
    rejectApplicationFailure(state, action) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    clearActionState(state) {
      state.actionSuccess = null;
      state.actionError = null;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const screeningActions = slice.actions;

export const useScreeningSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: screeningSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
