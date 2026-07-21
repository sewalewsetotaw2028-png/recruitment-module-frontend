import { call, put, takeLatest } from 'redux-saga/effects';
import { recruitmentDataActions } from './index';
import { apiFetch } from '@/services/apiClient';
import {
  mapBackendApplication,
  mapBackendInterview,
  mapBackendRecruitmentRequest,
  mapBackendVacancy,
  mapBackendWorkforcePlan,
} from '@/state/appContext.mappers';

// Action types for data fetching
export const FETCH_CANDIDATES = 'recruitmentData/fetchCandidates';
export const FETCH_VACANCIES = 'recruitmentData/fetchVacancies';
export const FETCH_APPLICATIONS = 'recruitmentData/fetchApplications';
export const FETCH_RECRUITMENT_REQUESTS = 'recruitmentData/fetchRecruitmentRequests';
export const FETCH_WORKFORCE_PLANS = 'recruitmentData/fetchWorkforcePlans';
export const FETCH_INTERVIEWS = 'recruitmentData/fetchInterviews';
export const FETCH_JOB_TEMPLATES = 'recruitmentData/fetchJobTemplates';
export const FETCH_JOB_POSTINGS = 'recruitmentData/fetchJobPostings';
export const FETCH_JOB_OFFERS = 'recruitmentData/fetchJobOffers';
export const FETCH_OFFER_TEMPLATES = 'recruitmentData/fetchOfferTemplates';
export const FETCH_TALENT_POOL = 'recruitmentData/fetchTalentPool';
export const FETCH_QUESTION_BANK = 'recruitmentData/fetchQuestionBank';
export const FETCH_SCREENING_RULES = 'recruitmentData/fetchScreeningRules';
export const FETCH_USERS = 'recruitmentData/fetchUsers';

// Worker sagas
function* fetchVacancies() {
  try {
    const response = yield call(apiFetch, '/api/v1/vacancies');
    if (response && response.status === 'success' && response.data) {
      const vacancies = (response.data as any[]).map(mapBackendVacancy);
      yield put(recruitmentDataActions.patchRecruitmentData({ vacancies }));
    }
  } catch (error) {
    console.error('Failed to fetch vacancies:', error);
  }
}

function* fetchApplications() {
  try {
    const response = yield call(apiFetch, '/api/v1/candidates/company/applications');
    if (response && response.status === 'success' && response.data) {
      const applications = (response.data as any[]).map(mapBackendApplication);
      yield put(recruitmentDataActions.patchRecruitmentData({ applications }));
    }
  } catch (error) {
    console.error('Failed to fetch applications:', error);
  }
}

function* fetchRecruitmentRequests() {
  try {
    const response = yield call(apiFetch, '/api/v1/recruitment/requests');
    if (response && response.status === 'success' && response.data) {
      const requests = (response.data as any[]).map(mapBackendRecruitmentRequest);
      yield put(recruitmentDataActions.patchRecruitmentData({ recruitmentRequests: requests }));
    }
  } catch (error) {
    console.error('Failed to fetch recruitment requests:', error);
  }
}

function* fetchWorkforcePlans() {
  try {
    const response = yield call(apiFetch, '/api/v1/workforce/plans');
    if (response && response.status === 'success' && response.data) {
      const plans = (response.data as any[]).map(mapBackendWorkforcePlan);
      yield put(recruitmentDataActions.patchRecruitmentData({ workforcePlans: plans }));
    }
  } catch (error) {
    console.error('Failed to fetch workforce plans:', error);
  }
}

function* fetchInterviews() {
  try {
    const response = yield call(apiFetch, '/api/v1/interviews/list');
    if (response && response.status === 'success' && response.data) {
      const interviews = (response.data as any[]).map(mapBackendInterview);
      yield put(recruitmentDataActions.patchRecruitmentData({ interviews }));
    }
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
  }
}

function* fetchUsers() {
  try {
    const response = yield call(apiFetch, '/api/v1/users');
    if (response && response.status === 'success' && response.data) {
      const users = Array.isArray(response.data) ? response.data : [];
      yield put(recruitmentDataActions.patchRecruitmentData({ users }));
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

function* fetchJobTemplates() {
  try {
    const response = yield call(apiFetch, '/api/v1/config/job-templates');
    if (response && response.status === 'success' && response.data) {
      const templates = Array.isArray(response.data) ? response.data : [];
      yield put(recruitmentDataActions.patchRecruitmentData({ jobTemplates: templates }));
    }
  } catch (error) {
    console.error('Failed to fetch job templates:', error);
  }
}

function* fetchJobOffers() {
  try {
    const response = yield call(apiFetch, '/api/v1/offers/company');
    if (response && response.status === 'success' && response.data) {
      const offers = Array.isArray(response.data) ? response.data : [];
      yield put(recruitmentDataActions.patchRecruitmentData({ jobOffers: offers }));
    }
  } catch (error) {
    console.error('Failed to fetch job offers:', error);
  }
}

// Watcher sagas
function* watchFetchVacancies() {
  yield takeLatest(FETCH_VACANCIES, fetchVacancies);
}

function* watchFetchApplications() {
  yield takeLatest(FETCH_APPLICATIONS, fetchApplications);
}

function* watchFetchRecruitmentRequests() {
  yield takeLatest(FETCH_RECRUITMENT_REQUESTS, fetchRecruitmentRequests);
}

function* watchFetchWorkforcePlans() {
  yield takeLatest(FETCH_WORKFORCE_PLANS, fetchWorkforcePlans);
}

function* watchFetchInterviews() {
  yield takeLatest(FETCH_INTERVIEWS, fetchInterviews);
}

function* watchFetchUsers() {
  yield takeLatest(FETCH_USERS, fetchUsers);
}

function* watchFetchJobTemplates() {
  yield takeLatest(FETCH_JOB_TEMPLATES, fetchJobTemplates);
}

function* watchFetchJobOffers() {
  yield takeLatest(FETCH_JOB_OFFERS, fetchJobOffers);
}

// Root saga
export function* recruitmentDataSaga() {
  yield [
    watchFetchVacancies(),
    watchFetchApplications(),
    watchFetchRecruitmentRequests(),
    watchFetchWorkforcePlans(),
    watchFetchInterviews(),
    watchFetchUsers(),
    watchFetchJobTemplates(),
    watchFetchJobOffers(),
  ];
}
