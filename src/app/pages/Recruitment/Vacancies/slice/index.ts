import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { vacanciesSaga } from './saga';
import type { VacanciesState } from './types';
import type { Vacancy } from '@/types';

interface JobDescriptionForm {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  benefits: string;
  employmentTerms: string;
  experienceRequired: string;
}

export const initialState: VacanciesState = {
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionSuccess: null,
  vacancies: [],
};

const slice = createSlice({
  name: 'vacancies',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
    fetchVacanciesRequest(state) {
      state.loading = true;
      state.error = null;
      state.actionSuccess = null;
    },
    fetchVacanciesSuccess(state, action: PayloadAction<Vacancy[]>) {
      state.loading = false;
      state.vacancies = action.payload;
    },
    fetchVacanciesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createVacancyRequest(state, action: PayloadAction<Partial<Vacancy>>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
      // Optimistically add local drafts (those without a real backend ID)
      // so they appear in the list immediately while the API call is in flight.
      if (action.payload?.id && action.payload.id.startsWith('vac-')) {
        state.vacancies = [action.payload as Vacancy, ...state.vacancies];
      }
    },
    createVacancySuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    createVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    updateVacancyRequest(
      state,
      _action: PayloadAction<{ vacancyId: string; payload: Partial<Vacancy> }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    updateVacancySuccess(state, action: PayloadAction<Vacancy>) {
  state.actionLoading = false;
  state.actionSuccess = 'updated';

  state.vacancies = state.vacancies.map((v) =>
    v.id === action.payload.id ? action.payload : v,
  );
},
    updateVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    updateVacancyJobContent(
      state,
      action: PayloadAction<{ vacancyId: string; form: JobDescriptionForm }>,
    ) {
      state.vacancies = state.vacancies.map((vacancy) =>
        vacancy.id === action.payload.vacancyId
          ? {
              ...vacancy,
              title: action.payload.form.title,
              description: action.payload.form.description,
              responsibilities: action.payload.form.responsibilities,
              requirements: action.payload.form.requirements,
              skills: action.payload.form.skills,
              benefits: action.payload.form.benefits,
              employmentTerms: action.payload.form.employmentTerms,
              experienceRequired: action.payload.form.experienceRequired,
            }
          : vacancy,
      );
    },
    postVacancyRequest(state, action: PayloadAction<string>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    postVacancySuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    postVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    unpostVacancyRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    unpostVacancySuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    unpostVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    closeVacancyRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    closeVacancySuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    closeVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    approveVacancyPostingRequest(
      state,
      action: PayloadAction<{ vacancyId: string; notes?: string }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    approveVacancyPostingSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    approveVacancyPostingFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    rejectVacancyPostingRequest(
      state,
      action: PayloadAction<{ vacancyId: string; reason: string }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    rejectVacancyPostingSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionSuccess = action.payload;
    },
    rejectVacancyPostingFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    holdVacancyRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    holdVacancySuccess(state, action: PayloadAction<Vacancy>) {
      state.actionLoading = false;
      state.actionSuccess = 'hold';
      state.vacancies = state.vacancies.map((v) =>
        v.id === action.payload.id ? action.payload : v,
      );
    },
    holdVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    resumeVacancyRequest(state, _action: PayloadAction<string>) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    resumeVacancySuccess(state, action: PayloadAction<Vacancy>) {
      state.actionLoading = false;
      state.actionSuccess = 'resume';
      state.vacancies = state.vacancies.map((v) =>
        v.id === action.payload.id ? action.payload : v,
      );
    },
    resumeVacancyFailure(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.actionError = action.payload;
    },
    setVacancyStatusRequest(
      state,
      _action: PayloadAction<{ vacancyId: string; status: string }>,
    ) {
      state.actionLoading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    setVacancyStatusSuccess(state, action: PayloadAction<Vacancy>) {
      state.actionLoading = false;
      state.actionSuccess = 'status';
      state.vacancies = state.vacancies.map((v) =>
        v.id === action.payload.id ? action.payload : v,
      );
    },
    setVacancyStatusFailure(state, action: PayloadAction<string>) {
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

export const vacanciesActions = slice.actions;

export const useVacanciesSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: vacanciesSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
