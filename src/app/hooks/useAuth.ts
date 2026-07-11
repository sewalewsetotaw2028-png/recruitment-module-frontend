import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { authActions, useAuthSlice } from '@/slice/authSlice';
import {
  selectAuthError,
  selectAuthLoading,
  selectAuthToken,
  selectAuthUser,
  selectIsAuthenticated,
} from '@/slice/authSlice/selectors';

/**
 * Session hook — login/register are dispatched from Authentication page slices.
 */
export function useAuth() {
  useAuthSlice();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const token = useAppSelector(selectAuthToken);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const logout = useCallback(() => {
    dispatch(authActions.logoutRequest());
  }, [dispatch]);

  return {
    user,
    token,
    logout,
    loading,
    error,
    isAuthenticated,
  };
}

export default useAuth;
