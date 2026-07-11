import { useMemo } from 'react';
import { useAppSelector } from '@/hooks';
import {
  canAccessPath,
  getDefaultDashboardPath,
  getNavItemsForRole,
} from '@/constants/navigation';
import {
  selectAuthLoading,
  selectAuthUser,
  selectIsAuthenticated,
} from '@/slice/authSlice/selectors';
import { normalizeAuthRole } from '@/utils/roleUtils';
import type { UserRole } from '@/state/appContext.types';

/**
 * Step 2 — session + role for navigation and guards (from auth slice, not mocks).
 */
export function useSession() {
  const user = useAppSelector(selectAuthUser);
  const loading = useAppSelector(selectAuthLoading);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const role = useMemo(
    () => normalizeAuthRole(user?.role),
    [user?.role],
  );

  const navItems = useMemo(() => getNavItemsForRole(role, user?.permissions ?? []), [role, user?.permissions]);

  const canAccessRoute = (pathname: string) =>
    canAccessPath(pathname, role, user?.permissions ?? []);

  return {
    user,
    role,
    loading,
    isAuthenticated,
    navItems,
    canAccessRoute,
    defaultPath: getDefaultDashboardPath(role, user?.permissions ?? []),
  };
}

export type { UserRole };
