import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { questionBankSaga } from './saga';
import type { QuestionBankState } from './types';

export const initialState: QuestionBankState = {
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'questionBank',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const questionBankActions = slice.actions;

export const useQuestionBankSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: questionBankSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
