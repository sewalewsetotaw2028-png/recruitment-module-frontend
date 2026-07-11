import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { authenticationLoginSaga } from './saga';
import type { AuthenticationLoginState, SubmitLoginPayload } from './types';

export const initialState: AuthenticationLoginState = {
  submitting: false,
  error: null,
};

const slice = createSlice({
  name: 'authenticationLogin',
  initialState,
  reducers: {
    submitLogin(state, _action: PayloadAction<SubmitLoginPayload>) {
      state.submitting = true;
      state.error = null;
    },
    submitEmailSignin(state, _action: PayloadAction<string>) {
      state.submitting = true;
      state.error = null;
    },
    submitLoginSuccess(state) {
      state.submitting = false;
      state.error = null;
    },
    submitLoginFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.error = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const authenticationLoginActions = slice.actions;

export const useAuthenticationLoginSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: authenticationLoginSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
