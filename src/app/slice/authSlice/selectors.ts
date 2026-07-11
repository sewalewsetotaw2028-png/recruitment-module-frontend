import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectAuthDomain = (state: RootState) =>
  (state as RootState & { auth?: typeof initialState }).auth ?? initialState;

export const selectAuthUser = createSelector(
  [selectAuthDomain],
  (auth) => auth.user,
);

export const selectAuthToken = createSelector(
  [selectAuthDomain],
  (auth) => auth.token,
);

export const selectAuthRefreshToken = createSelector(
  [selectAuthDomain],
  (auth) => auth.refreshToken,
);

export const selectAuthLoading = createSelector(
  [selectAuthDomain],
  (auth) => auth.loading,
);

export const selectAuthError = createSelector(
  [selectAuthDomain],
  (auth) => auth.error,
);

export const selectIsAuthenticated = createSelector(
  [selectAuthDomain],
  (auth) => auth.isAuthenticated,
);
