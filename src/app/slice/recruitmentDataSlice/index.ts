import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RecruitmentDataState } from './types';

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-wealth', name: 'Wealth Management' },
  { id: 'dept-risk', name: 'Risk & Compliance' },
  { id: 'dept-tech', name: 'FinTech & Innovation' },
  { id: 'dept-retail', name: 'Retail Banking' },
];

export const initialState: RecruitmentDataState = {
  departments: DEFAULT_DEPARTMENTS,
  candidates: [],
  vacancies: [],
  applications: [],
  recruitmentRequests: [],
  workforcePlans: [],
  interviews: [],
  questionBank: [],
  screeningRules: [],
  users: [],
  jobTemplates: [],
  jobPostings: [],
  jobOffers: [],
  offerTemplates: [],
  talentPool: [],
  hrisIntegrationAvailable: true,
  hrisManualMode: false,
  savedJobIds: [],
};

const slice = createSlice({
  name: 'recruitmentData',
  initialState,
  reducers: {
    patchRecruitmentData(
      state,
      action: PayloadAction<Partial<RecruitmentDataState>>,
    ) {
      Object.assign(state, action.payload);
    },
    resetRecruitmentData() {
      return initialState;
    },
  },
});

export const recruitmentDataActions = slice.actions;
export default slice.reducer;
