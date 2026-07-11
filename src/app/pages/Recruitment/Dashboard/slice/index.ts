import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { recruitmentDashboardSaga } from './saga';
import type {
  RecruitmentDashboardState,
  RecruitmentDashboardStats,
} from './types';

export const initialState: RecruitmentDashboardState = {
  loading: false,
  error: null,
  summary: undefined,
  pipeline: undefined,
  sourcing: undefined,
  kpis: undefined,
};

const slice = createSlice({
  name: 'recruitmentDashboard',
  initialState,
  reducers: {
    fetchDashboardRequest(
      state,
      action: PayloadAction<
        { period?: string; startDate?: string; endDate?: string; departmentId?: string; vacancyId?: string; } | undefined
      >,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchDashboardSuccess(
      state,
      action: PayloadAction<{
        summary: RecruitmentDashboardStats['summary'];
        pipeline: RecruitmentDashboardStats['pipeline'];
        sourcing?: RecruitmentDashboardStats['sourcing'];
        kpis?: RecruitmentDashboardStats['kpis'];
        trends?: RecruitmentDashboardStats['trends'];
      }>,
    ) {
      state.loading = false;
      state.error = null;
      state.summary = action.payload.summary;
      state.pipeline = action.payload.pipeline;
      state.sourcing = action.payload.sourcing;
      state.kpis = action.payload.kpis;
      state.trends = action.payload.trends;
      state.lastFetchedAt = Date.now();
    },
    fetchDashboardFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const recruitmentDashboardActions = slice.actions;

export const useRecruitmentDashboardSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: recruitmentDashboardSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
