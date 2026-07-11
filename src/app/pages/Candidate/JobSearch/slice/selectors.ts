import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/store/types/RootState';

import { initialState } from './index';



const selectDomain = (state: RootState) =>

  (state as RootState & { candidateJobSearch?: typeof initialState }).candidateJobSearch ??

  initialState;



export const selectJobSearchVacancies = createSelector(

  [selectDomain],

  (s) => s.vacancies,

);



export const selectJobSearchLoading = createSelector(

  [selectDomain],

  (s) => s.loading,

);



export const selectJobSearchError = createSelector(

  [selectDomain],

  (s) => s.error,

);



export const selectJobSearchActionSuccess = createSelector(

  [selectDomain],

  (s) => s.actionSuccess,

);



export const selectJobSearchActionError = createSelector(

  [selectDomain],

  (s) => s.actionError,

);

