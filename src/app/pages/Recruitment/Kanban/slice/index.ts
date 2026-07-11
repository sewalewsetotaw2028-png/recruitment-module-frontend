import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { kanbanSaga } from './saga';
import type { KanbanState } from './types';

export const initialState: KanbanState = {
  loading: false,
  error: null,
  applications: [],
};

const slice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    fetchKanbanRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchKanbanSuccess(state, action) {
      state.loading = false;
      state.applications = action.payload;
    },
    fetchKanbanFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const kanbanActions = slice.actions;

export const useKanbanSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: kanbanSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
