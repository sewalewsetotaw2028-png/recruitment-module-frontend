import type { AuthUser } from '@/slice/authSlice/types';
import type { UserRole } from '@/state/appContext.types';
import type { User } from '@/types';
import { PERMISSIONS } from '@/lib/permissions-shared';

/** Map API / auth role string to app UserRole */
export function normalizeAuthRole(role: string | undefined): UserRole {
  if (!role) return 'candidate';
  const normalized = role.toLowerCase().replace(/[- ]/g, '_');
  switch (normalized) {
    case 'candidate':
    case 'applicant':
      return 'candidate';
    case 'recruiter':
      return 'recruiter';
    case 'hr':
    case 'hr_admin':
      return 'hr_admin';
    case 'ceo':
      return 'ceo';
    case 'hiring_manager':
      return 'hiring_manager';
    case 'department_manager':
      return 'department_manager';
    case 'interviewer':
      return 'interviewer';
    default:
      return 'candidate';
  }
}

export function roleDisplayName(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    candidate: 'Candidate',
    applicant: 'Applicant',
    hr: 'HR',
    recruiter: 'Recruiter',
    hr_admin: 'HR Admin',
    ceo: 'CEO',
    hiring_manager: 'Hiring Manager',
    department_manager: 'Department Manager',
    interviewer: 'Interviewer',
  };
  return labels[role] ?? role;
}

/** Minimal User for permission helpers (types expect roleSlug on staff roles) */
export function buildPermissionUser(
  authUser: AuthUser | null,
  role: UserRole,
): User {
  const staffSlug =
    role === 'candidate' || role === 'applicant'
      ? 'applicant'
      : (role as User['roleSlug']);

  return {
    id: authUser?.id ?? 'unknown',
    organizationId: authUser?.organizationId ?? '',
    firstName: authUser?.firstName ?? 'User',
    lastName: authUser?.lastName ?? '',
    email: authUser?.email ?? '',
    roleSlug: staffSlug,
    roleName: roleDisplayName(role),
  };
}

export function mapCandidateProfileToAuthUser(
  profile: Record<string, unknown>,
): AuthUser {
  const permissions = Array.isArray(profile.permissions)
    ? profile.permissions
    : Array.isArray(profile.candidate_permissions)
      ? profile.candidate_permissions
      : [PERMISSIONS.CANDIDATE_APPLICATION_READ];

  return {
    id: String(profile.id ?? ''),
    email: String(profile.email ?? ''),
    firstName: String(profile.first_name ?? profile.firstName ?? ''),
    lastName: String(profile.last_name ?? profile.lastName ?? ''),
    organizationId: String(profile.company_id ?? profile.organizationId ?? ''),
    organizationName: String(
      profile.company_name ?? profile.organizationName ?? '',
    ),
    role: 'candidate',
    roleSlug: 'candidate',
    permissions: permissions.map((permission) => String(permission)),
  };
}
