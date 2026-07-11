import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { offersSaga } from './saga';
import type { OffersState } from './types';

export const initialState: OffersState = {
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const offersActions = slice.actions;

export const useOffersSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: offersSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
