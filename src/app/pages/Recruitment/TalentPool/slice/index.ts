import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { talentPoolSaga } from './saga';
import type { TalentPoolState } from './types';

export const initialState: TalentPoolState = {
  loading: false,
  error: null,
  entries: [],
};

const slice = createSlice({
  name: 'talentPool',
  initialState,
  reducers: {
    fetchTalentPoolRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchTalentPoolSuccess(state, action) {
      state.loading = false;
      state.entries = action.payload;
    },
    fetchTalentPoolFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const talentPoolActions = slice.actions;

export const useTalentPoolSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: talentPoolSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
