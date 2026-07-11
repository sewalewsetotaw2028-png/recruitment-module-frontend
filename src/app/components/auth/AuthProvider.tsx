import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch } from '@/hooks';
import { authActions } from '@/slice/authSlice';
import type { AuthUser } from '@/slice/authSlice/types';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
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
