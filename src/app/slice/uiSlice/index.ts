import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { VacancyHubView } from '@/state/appContext.types';

import type { UiState } from './types';



export const initialState: UiState = {

  activeTab: 'dashboard',

  planningViewIntent: null,

  requestViewIntent: null,

  vacancyHubView: 'list',

  selectedVacancyId: null,

};



const slice = createSlice({

  name: 'ui',

  initialState,

  reducers: {

    setActiveTab(state, action: PayloadAction<string>) {

      state.activeTab = action.payload;

    },

    setPlanningViewIntent(

      state,

      action: PayloadAction<UiState['planningViewIntent']>,

    ) {

      state.planningViewIntent = action.payload;

    },

    setRequestViewIntent(

      state,

      action: PayloadAction<UiState['requestViewIntent']>,

    ) {

      state.requestViewIntent = action.payload;

    },

    setVacancyHubView(state, action: PayloadAction<VacancyHubView>) {

      state.vacancyHubView = action.payload;

    },

    setSelectedVacancyId(state, action: PayloadAction<string | null>) {

      state.selectedVacancyId = action.payload;

    },

    resetUi() {

      return initialState;

    },

  },

});



export const uiActions = slice.actions;

export default slice.reducer;

