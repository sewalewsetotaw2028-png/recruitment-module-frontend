import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';

/**
 * Redirects when the current role cannot access the nested dashboard route.
 */
export const RoleGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const { canAccessRoute, defaultPath, loading } = useSession();

  if (loading) return null;

  if (!canAccessRoute(location.pathname)) {
    if (location.pathname === defaultPath) {
      return <>{children}</>;
    }
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};
