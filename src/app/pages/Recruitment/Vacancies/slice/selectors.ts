import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import type { Vacancy } from '@/types';
import type { VacanciesState } from './types';

const initialState: VacanciesState = {
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionSuccess: null,
  vacancies: [],
};

const selectDomain = (state: RootState) =>
  (state as RootState & { vacancies?: VacanciesState }).vacancies ??
  initialState;

export const selectVacancies = createSelector(
  [selectDomain],
  (s) => s.vacancies as Vacancy[],
);

export const selectVacanciesLoading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const selectVacanciesError = createSelector(
  [selectDomain],
  (s) => s.error,
);

export const selectVacanciesActionLoading = createSelector(
  [selectDomain],
  (s) => s.actionLoading,
);

export const selectVacanciesActionError = createSelector(
  [selectDomain],
  (s) => s.actionError,
);

export const selectVacanciesActionSuccess = createSelector(
  [selectDomain],
  (s) => s.actionSuccess,
);
