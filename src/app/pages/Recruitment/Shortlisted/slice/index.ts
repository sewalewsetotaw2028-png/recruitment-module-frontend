import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { shortlistedSaga } from './saga';
import type { ShortlistedState } from './types';

export const initialState: ShortlistedState = {
  loading: false,
  error: null,
  applications: [],
};

const slice = createSlice({
  name: 'shortlisted',
  initialState,
  reducers: {
    fetchShortlistedRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchShortlistedSuccess(state, action) {
      state.loading = false;
      state.applications = action.payload;
    },
    fetchShortlistedFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const shortlistedActions = slice.actions;

export const useShortlistedSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: shortlistedSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
