import { createSlice } from '@reduxjs/toolkit';

import { useInjectReducer, useInjectSaga } from 'redux-injectors';

import { candidateApplicationsSaga } from './saga';

import type { CandidateApplicationsState } from './types';



export const initialState: CandidateApplicationsState = {

  loading: false,

  error: null,

  applications: [],

  interviews: [],

};



const slice = createSlice({

  name: 'candidateApplications',

  initialState,

  reducers: {

    fetchApplicationsRequest(state) {

      state.loading = true;

      state.error = null;

    },

    fetchApplicationsSuccess(state, action) {

      state.loading = false;

      state.applications = action.payload.applications;

      state.interviews = action.payload.interviews;

    },

    fetchApplicationsFailure(state, action) {

      state.loading = false;

      state.error = action.payload;

    },

    reset(state) {

      Object.assign(state, initialState);

    },

  },

});



export const candidateApplicationsActions = slice.actions;



export const useCandidateApplicationsSlice = () => {

  useInjectReducer({ key: slice.name, reducer: slice.reducer });

  useInjectSaga({ key: slice.name, saga: candidateApplicationsSaga });

  return { actions: slice.actions };

};



export default slice.reducer;

