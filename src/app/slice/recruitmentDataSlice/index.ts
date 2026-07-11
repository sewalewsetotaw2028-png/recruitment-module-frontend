import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  mockApplications,
  mockCandidates,
  mockInterviews,
  mockJobOffers,
  mockJobPostings,
  mockJobTemplates,
  mockOfferTemplates,
  mockQuestionBank,
  mockRecruitmentRequests,
  mockScreeningRules,
  mockTalentPool,
  mockUsers,
  mockVacancies,
  mockWorkforcePlans,
} from '@/data/dummyData';
import type { RecruitmentDataState } from './types';

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-wealth', name: 'Wealth Management' },
  { id: 'dept-risk', name: 'Risk & Compliance' },
  { id: 'dept-tech', name: 'FinTech & Innovation' },
  { id: 'dept-retail', name: 'Retail Banking' },
];

export const initialState: RecruitmentDataState = {
  departments: DEFAULT_DEPARTMENTS,
  candidates: mockCandidates,
  vacancies: [],
  applications: [],
  recruitmentRequests: [],
  workforcePlans: [],
  interviews: [],
  questionBank: mockQuestionBank,
  screeningRules: mockScreeningRules,
  users: mockUsers,
  jobTemplates: mockJobTemplates,
  jobPostings: mockJobPostings,
  jobOffers: mockJobOffers,
  offerTemplates: mockOfferTemplates,
  talentPool: mockTalentPool,
  hrisIntegrationAvailable: true,
  hrisManualMode: false,
  usingMockData: false,
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
    applyMockDataset(state) {
      state.vacancies = mockVacancies;
      state.applications = mockApplications;
      state.recruitmentRequests = mockRecruitmentRequests;
      state.workforcePlans = mockWorkforcePlans;
      state.interviews = mockInterviews;
      state.usingMockData = true;
    },
    setUsingMockData(state, action: PayloadAction<boolean>) {
      state.usingMockData = action.payload;
    },
    resetRecruitmentData() {
      return initialState;
    },
  },
});

export const recruitmentDataActions = slice.actions;
export default slice.reducer;
