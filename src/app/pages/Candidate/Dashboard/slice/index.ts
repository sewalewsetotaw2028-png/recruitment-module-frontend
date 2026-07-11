import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { useInjectReducer, useInjectSaga } from 'redux-injectors';

import { candidateDashboardSaga } from './saga';

import type { CandidateDashboardState } from './types';



export const initialState: CandidateDashboardState = {

  loading: false,

  error: null,

  applications: [],

  interviews: [],

  offers: [],

  completeness: null,

};



const slice = createSlice({

  name: 'candidateDashboard',

  initialState,

  reducers: {

    fetchDashboardRequest(state) {

      state.loading = true;

      state.error = null;

    },

    fetchDashboardSuccess(

      state,

      action: PayloadAction<

        Pick<CandidateDashboardState, 'applications' | 'interviews' | 'offers' | 'completeness'>

      >,

    ) {

      state.loading = false;

      state.applications = action.payload.applications;

      state.interviews = action.payload.interviews;

      state.offers = action.payload.offers;

      state.completeness = action.payload.completeness;

    },

    fetchDashboardFailure(state, action: PayloadAction<string>) {

      state.loading = false;

      state.error = action.payload;

    },

  },

});



export const candidateDashboardActions = slice.actions;



export const useCandidateDashboardSlice = () => {

  useInjectReducer({ key: slice.name, reducer: slice.reducer });

  useInjectSaga({ key: slice.name, saga: candidateDashboardSaga });

  return { actions: slice.actions };

};



export default slice.reducer;

