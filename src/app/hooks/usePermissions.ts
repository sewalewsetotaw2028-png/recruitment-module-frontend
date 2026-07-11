/**
 * usePermissions.ts  —  FRONTEND PERMISSION HOOK
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE: where does permission logic live?
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * BACKEND only:
 *   - The full ROLES / PERMISSIONS / DEFAULT_ROLE_PERMISSIONS matrix
 *   - The runtime enforcement (middleware that checks DB rows before every request)
 *   - The config API that HR uses to change role→permission mappings
 *
 * FRONTEND only:
 *   - This hook — reads the user's live permission slugs from the session
 *     (as returned by the login / me endpoint, populated from the DB)
 *   - UI visibility gating (hide/show buttons, redirect on route guard)
 *     NOTE: hiding a button is UX, not security. The backend enforces everything.
 *
 * SHARED (frontend imports from backend package or a shared-types package):
 *   - ROLES constant  — for role name display and role-specific UI branches
 *   - PERMISSIONS constant  — to avoid hardcoding slug strings in components
 *   - RoleSlug / PermissionSlug types
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ISSUES FIXED FROM PREVIOUS VERSION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * OLD APPROACH (broken):
 *   The old hook called canCreateVacancy(permissionUser), canEditWorkforcePlan(...)
 *   etc. — functions from a separate permissions.ts that hard-coded role→action
 *   mappings. This meant:
 *   a) Two places defined what each role could do (permissions.ts + the DB seed).
 *      They could diverge silently.
 *   b) When HR changed a role's permissions in the config UI, the frontend would
 *      still show/hide buttons based on the old hardcoded logic — not the new DB state.
 *   c) Every new permission required editing three files: the DB migration,
 *      the backend permissions.ts, and the frontend permissions.ts.
 *
 * NEW APPROACH:
 *   The session includes the user's live permission slugs (fetched from
 *   AppUserRole → AppRole → AppRolePermission → AppPermission on login).
 *   The hook exposes a single `can(slug)` function that checks that list.
 *   No logic about what roles are allowed to do lives here — only the DB knows that.
 */

import { useEffect, useMemo } from 'react';
import { useSession } from '@/hooks/useSession';
import { useAppDispatch } from '@/hooks';
import { authActions } from '@/slice/authSlice';
// Import PERMISSIONS from the shared package so slug strings are never hardcoded
// in components. If you don't have a shared package yet, copy only PERMISSIONS
// and the PermissionSlug type from the backend permissions.ts into
// src/lib/permissions-shared.ts and import from there.
import { PERMISSIONS, ROLES } from '@/lib/permissions-shared';
import type { PermissionSlug, RoleSlug } from '@/lib/permissions-shared';

export type { PermissionSlug, RoleSlug };
export { PERMISSIONS, ROLES };

export interface UsePermissionsReturn {
  /** The user's current role slug, as stored in the session */
  roleSlug: RoleSlug | undefined;

  /**
   * The live set of permission slugs this user holds.
   * Populated from the DB (AppRolePermission rows) on login / session refresh.
   * Reflects any config changes HR has made — no hardcoded logic here.
   */
  permissions: Set<PermissionSlug>;

  /**
   * Primary check — use this everywhere in components.
   *
   * @example
   *   const { can } = usePermissions();
   *   if (!can(PERMISSIONS.VACANCY_CREATE)) return null;
   */
  can: (permission: PermissionSlug) => boolean;

  /**
   * Check multiple permissions at once — user must hold ALL of them.
   * Useful for pages that require a combination (e.g. read + write).
   */
  canAll: (...permissions: PermissionSlug[]) => boolean;

  /**
   * Check multiple permissions — user must hold AT LEAST ONE.
   * Useful for "show nav item if user can do anything in this module".
   */
  canAny: (...permissions: PermissionSlug[]) => boolean;

  /**
   * Role-identity checks — use sparingly.
   * Prefer can() for feature gating; use is() only when the UI needs to
   * render role-specific copy or layout (e.g. "CEO dashboard" vs "HR dashboard").
   */
  is: (role: RoleSlug) => boolean;
  isAny: (...roles: RoleSlug[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  // The session must include:
  //   user.roleSlug     — the user's role (string)
  //   user.permissions  — string[] of permission slugs from the DB
  // These are set by the login endpoint after resolving
  // AppUserRole → AppRole → AppRolePermission → AppPermission.
  const { user, isAuthenticated } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Poll for updated permissions every 30 seconds
    const interval = setInterval(() => {
      dispatch(authActions.silentGetMeRequest());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  const roleSlug = user?.roleSlug as RoleSlug | undefined;

  const permissions = useMemo(
    () =>
      new Set<PermissionSlug>((user?.permissions ?? []) as PermissionSlug[]),
    [user?.permissions],
  );

  return useMemo(
    () => ({
      roleSlug,
      permissions,

      can: (permission: PermissionSlug) => permissions.has(permission),

      canAll: (...perms: PermissionSlug[]) =>
        perms.every((p) => permissions.has(p)),

      canAny: (...perms: PermissionSlug[]) =>
        perms.some((p) => permissions.has(p)),

      is: (role: RoleSlug) => roleSlug === role,

      isAny: (...roles: RoleSlug[]) => roles.includes(roleSlug as RoleSlug),
    }),
    [roleSlug, permissions],
  );
}

export default usePermissions;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Hide a button the user can't use:
 *
 *   const { can } = usePermissions();
 *   {can(PERMISSIONS.VACANCY_CREATE) && <CreateVacancyButton />}
 *
 * 2. Guard a whole route (in your route config or layout component):
 *
 *   const { can } = usePermissions();
 *   if (!can(PERMISSIONS.CONFIG_READ)) return <Navigate to="/dashboard" />;
 *
 * 3. Show different UI based on role identity (layout, not feature gating):
 *
 *   const { is } = usePermissions();
 *   {is(ROLES.CEO) ? <CeoDashboard /> : <HrDashboard />}
 *
 * 4. Show a nav section if the user can do anything in that module:
 *
 *   const { canAny } = usePermissions();
 *   const showInterviewNav = canAny(
 *     PERMISSIONS.INTERVIEW_READ,
 *     PERMISSIONS.INTERVIEW_CREATE,
 *     PERMISSIONS.INTERVIEW_EVALUATE,
 *   );
 *
 * 5. Require both read and write before showing the config page:
 *
 *   const { canAll } = usePermissions();
 *   if (!canAll(PERMISSIONS.CONFIG_READ, PERMISSIONS.CONFIG_WRITE)) return null;
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SESSION SHAPE EXPECTED (set by your login / me endpoint)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   interface SessionUser {
 *     id:          string;
 *     roleSlug:    string;   // from AppRole.slug via AppUserRole
 *     permissions: string[]; // from AppPermission.slug via AppRolePermission
 *     // ... other user fields
 *   }
 *
 * The login handler should do something like:
 *
 *   const userRoles = await db.appUserRole.findMany({
 *     where: { user_id: user.id },
 *     include: {
 *       role: {
 *         include: {
 *           role_permissions: { include: { permission: true } },
 *         },
 *       },
 *     },
 *   });
 *
 *   const permissions = userRoles.flatMap(ur =>
 *     ur.role.role_permissions.map(rp => rp.permission.slug)
 *   );
 *   const roleSlug = userRoles[0]?.role.slug;  // primary role
 *
 *   // Put roleSlug and permissions into the JWT / session cookie
 */
