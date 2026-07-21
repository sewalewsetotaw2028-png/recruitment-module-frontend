import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { authenticationSignupSaga } from './saga';
import type {
  AuthenticationSignupState,
  SubmitSignupPayload,
  SubmitEmailSigninPayload,
} from './types';

export const initialState: AuthenticationSignupState = {
  submitting: false,
  error: null,
  signupSuccess: false,
};

const slice = createSlice({
  name: 'authenticationSignup',
  initialState,
  reducers: {
    submitSignup(state, _action: PayloadAction<SubmitSignupPayload>) {
      state.submitting = true;
      state.error = null;
    },
    submitEmailSignin(state, _action: PayloadAction<string>) {
      state.submitting = true;
      state.error = null;
    },
    submitSignupSuccess(state) {
      state.submitting = false;
      state.error = null;
      state.signupSuccess = true;
    },
    submitSignupFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.error = action.payload;
      state.signupSuccess = false;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const authenticationSignupActions = slice.actions;

export const useAuthenticationSignupSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: authenticationSignupSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
