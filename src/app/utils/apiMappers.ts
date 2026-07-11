import type { AuthUser } from '@/slice/authSlice/types';

/** Raw user object from backend (snake_case or mixed) */
export interface ApiUserPayload {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  company_id?: string;
  company_name?: string;
  organizationId?: string;
  organizationName?: string;
  role: string;
  roles?: string[];
  roleSlug?: string;
  permissions?: string[];
  department_id?: string;
  department_name?: string;
  departmentId?: string;
  departmentName?: string;
}

export function mapApiUserToAuthUser(payload: ApiUserPayload): AuthUser {
  return {
    id: payload.id,
    email: payload.email,
    firstName: payload.first_name ?? payload.firstName,
    lastName: payload.last_name ?? payload.lastName,
    organizationId:
      payload.company_id ?? payload.organizationId ?? '',
    organizationName: payload.company_name ?? payload.organizationName,
    role: payload.role,
    roleSlug: payload.roleSlug ?? payload.role,
    permissions: payload.permissions ?? [],
    departmentId: payload.department_id ?? payload.departmentId,
    departmentName: payload.department_name ?? payload.departmentName,
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}
