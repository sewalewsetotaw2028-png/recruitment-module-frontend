import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch } from '@/hooks';
import { authActions } from '@/slice/authSlice';
import type { AuthUser } from '@/slice/authSlice/types';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check for OAuth/magic link tokens in URL hash (cross-origin localStorage workaround)
    const hash = window.location.hash;
    if (hash && (hash.includes('token=') || hash.includes('access_token='))) {
      try {
        const params = new URLSearchParams(hash.replace('#', ''));
        const token = params.get('token') || params.get('access_token') || '';
        const refreshToken = params.get('refreshToken') || '';
        if (token) {
          localStorage.setItem('token', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          // Clear hash to prevent re-processing on subsequent navigations
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (e) {
        console.error('Failed to parse auth tokens from URL hash:', e);
      }
    }

    const handleUnauthorized = () => {
      dispatch(authActions.logoutSuccess());
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);

    if (import.meta.env.DEV) {
      const devRole = new URLSearchParams(window.location.search).get('devRole');
      if (devRole) {
        const devUser: AuthUser = {
          id: `dev-${devRole}`,
          email: `${devRole}@capitalbank.et`,
          firstName: 'Frontend',
          lastName: 'Reviewer',
          organizationId: 'org-1',
          organizationName: 'Capital Bank',
          role: devRole,
        };
        dispatch(
          authActions.setCredentials({
            user: devUser,
            token: 'frontend-dev-token',
          }),
        );
        return () => {
          window.removeEventListener(
            'auth:unauthorized',
            handleUnauthorized as EventListener,
          );
        };
      }
    }

    dispatch(authActions.bootstrapRequest());
    return () => {
      window.removeEventListener(
        'auth:unauthorized',
        handleUnauthorized as EventListener,
      );
    };
  }, [dispatch]);

  return <>{children}</>;
};
