import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { useInjectReducer, useInjectSaga } from 'redux-injectors';

import { authSaga } from './saga';

import type { AuthState, AuthUser, LoginPayload, RegisterPayload } from './types';



const readStoredAuth = (): Pick<

  AuthState,

  'user' | 'token' | 'refreshToken' | 'isAuthenticated'

> => {

  const token = localStorage.getItem('token');

  const refreshToken = localStorage.getItem('refreshToken');

  const rawUser = localStorage.getItem('user');

  let user: AuthUser | null = null;

  if (rawUser && rawUser !== 'undefined') {

    try {

      user = JSON.parse(rawUser) as AuthUser;

    } catch {

      user = null;

    }

  }

  return {

    user,

    token,

    refreshToken,

    isAuthenticated: Boolean(token && user),

  };

};



export const initialState: AuthState = {

  ...readStoredAuth(),

  loading: true,

  error: null,

};



const slice = createSlice({

  name: 'auth',

  initialState,

  reducers: {

    bootstrapRequest(state) {

      state.loading = true;

      state.error = null;

    },

    loginRequest(state, _action: PayloadAction<LoginPayload>) {

      state.loading = true;

      state.error = null;

    },

    loginSuccess(

      state,

      action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string }>,

    ) {

      state.user = action.payload.user;

      state.token = action.payload.token;

      state.refreshToken = action.payload.refreshToken ?? null;

      state.loading = false;

      state.error = null;

      state.isAuthenticated = true;

      localStorage.setItem('token', action.payload.token);

      if (action.payload.refreshToken) {

        localStorage.setItem('refreshToken', action.payload.refreshToken);

      }

      localStorage.setItem('user', JSON.stringify(action.payload.user));

    },

    loginFailure(state, action: PayloadAction<string>) {

      state.loading = false;

      state.error = action.payload;

      state.isAuthenticated = false;

    },

    registerRequest(state, _action: PayloadAction<RegisterPayload>) {

      state.loading = true;

      state.error = null;

    },

    registerSuccess(state) {

      state.loading = false;

      state.error = null;

    },

    registerFailure(state, action: PayloadAction<string>) {

      state.loading = false;

      state.error = action.payload;

    },

    getMeRequest(state) {

      state.loading = true;

      state.error = null;

    },

    silentGetMeRequest(state) {

      // Do not set loading to true for silent requests

    },

    getMeSuccess(state, action: PayloadAction<AuthUser>) {

      state.user = action.payload;

      state.loading = false;

      state.error = null;

      state.isAuthenticated = true;

      localStorage.setItem('user', JSON.stringify(action.payload));

    },

    getMeFailure(state, action: PayloadAction<string>) {

      state.loading = false;

      state.error = action.payload;

      state.user = null;

      state.token = null;

      state.refreshToken = null;

      state.isAuthenticated = false;

      localStorage.removeItem('token');

      localStorage.removeItem('refreshToken');

      localStorage.removeItem('user');

    },

    setLoading(state, action: PayloadAction<boolean>) {

      state.loading = action.payload;

    },

    setCredentials(

      state,

      action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string }>,

    ) {

      state.user = action.payload.user;

      state.token = action.payload.token;

      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;

      state.loading = false;

      state.error = null;

      state.isAuthenticated = true;

      localStorage.setItem('token', action.payload.token);

      if (action.payload.refreshToken) {

        localStorage.setItem('refreshToken', action.payload.refreshToken);

      }

      localStorage.setItem('user', JSON.stringify(action.payload.user));

    },

    clearCredentials(state) {

      state.user = null;

      state.token = null;

      state.refreshToken = null;

      state.loading = false;

      state.error = null;

      state.isAuthenticated = false;

      localStorage.removeItem('token');

      localStorage.removeItem('refreshToken');

      localStorage.removeItem('user');

    },

    setAuthError(state, action: PayloadAction<string | null>) {

      state.error = action.payload;

      state.loading = false;

    },

    logoutRequest(state) {

      state.loading = true;

    },

    logoutSuccess(state) {

      state.user = null;

      state.token = null;

      state.refreshToken = null;

      state.loading = false;

      state.error = null;

      state.isAuthenticated = false;

      localStorage.removeItem('token');

      localStorage.removeItem('refreshToken');

      localStorage.removeItem('user');

    },

  },

});



export const authActions = slice.actions;



export const useAuthSlice = () => {

  useInjectReducer({ key: slice.name, reducer: slice.reducer });

  useInjectSaga({ key: slice.name, saga: authSaga });

  return { actions: slice.actions };

};



export default slice.reducer;

