import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { recruitmentSettingsSaga } from './saga';
import type { RecruitmentSettingsState } from './types';

export const initialState: RecruitmentSettingsState = {
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'recruitmentSettings',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const recruitmentSettingsActions = slice.actions;

export const useRecruitmentSettingsSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: recruitmentSettingsSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
