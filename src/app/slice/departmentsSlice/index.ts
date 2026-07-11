import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { departmentsSaga } from './saga';
import type { DepartmentsState } from './types';

export const initialState: DepartmentsState = {
  loading: false,
  error: null,
  departments: [],
};

const slice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
    fetchDepartmentsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchDepartmentsSuccess(
      state,
      action: PayloadAction<Array<{ id: string; name: string }>>,
    ) {
      state.loading = false;
      state.departments = action.payload;
    },
    fetchDepartmentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const departmentsActions = slice.actions;

export const useDepartmentsSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: departmentsSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
