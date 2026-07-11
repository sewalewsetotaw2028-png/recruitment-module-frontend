import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { recruitmentRequestCreateSaga } from './saga';
import type { RecruitmentRequestCreateState } from './types';

export const initialState: RecruitmentRequestCreateState = {
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'recruitmentRequestCreate',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const recruitmentRequestCreateActions = slice.actions;

export const useRecruitmentRequestCreateSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: recruitmentRequestCreateSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
