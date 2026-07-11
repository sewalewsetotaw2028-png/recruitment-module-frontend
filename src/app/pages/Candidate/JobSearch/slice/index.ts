import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { useInjectReducer, useInjectSaga } from 'redux-injectors';

import { candidateJobSearchSaga } from './saga';

import type { CandidateJobSearchState } from './types';

import type { Vacancy } from '@/types';



export const initialState: CandidateJobSearchState = {

  loading: false,

  error: null,

  vacancies: [],

  actionSuccess: null,

  actionError: null,

};



const slice = createSlice({

  name: 'candidateJobSearch',

  initialState,

  reducers: {

    fetchVacanciesRequest(state) {

      state.loading = true;

      state.error = null;

    },

    fetchVacanciesSuccess(state, action: PayloadAction<Vacancy[]>) {

      state.loading = false;

      state.vacancies = action.payload;

    },

    fetchVacanciesFailure(state, action: PayloadAction<string>) {

      state.loading = false;

      state.error = action.payload;

    },



    applyToJobRequest(

      state,

      _action: PayloadAction<{ vacancyId: string; coverLetter?: string | File; expectedSalary?: number; recruitmentSourceId?: string }>

    ) {

      state.loading = true;

      state.actionSuccess = null;

      state.actionError = null;

    },

    applyToJobSuccess(state) {

      state.loading = false;

      state.actionSuccess = 'Application submitted successfully!';

    },

    applyToJobFailure(state, action: PayloadAction<string>) {

      state.loading = false;

      state.actionError = action.payload;

    },



    clearActions(state) {

      state.actionSuccess = null;

      state.actionError = null;

    },



    reset(state) {

      Object.assign(state, initialState);

    },

  },

});



export const candidateJobSearchActions = slice.actions;



export const useCandidateJobSearchSlice = () => {

  useInjectReducer({ key: slice.name, reducer: slice.reducer });

  useInjectSaga({ key: slice.name, saga: candidateJobSearchSaga });

  return { actions: slice.actions };

};



export default slice.reducer;

