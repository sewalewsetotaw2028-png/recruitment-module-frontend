import { apiFetch } from '@/services/apiClient';
import { API_ROUTES } from '@/API';

export interface UserRole {
  id: string;
  company_id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  roles: UserRole[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CompanyUsersResponse {
  users: CompanyUser[];
  pagination: PaginationMeta;
}

export interface CreateCompanyUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roleIds: string[];
}

export interface FetchUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchCompanyUsers(
  params: FetchUsersParams = {},
): Promise<CompanyUsersResponse> {
  const { page = 1, limit = 20, search } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });
  const res = await apiFetch(`${API_ROUTES.config.users}?${qs.toString()}`);
  return {
    users: res.data as CompanyUser[],
    pagination: res.pagination as PaginationMeta,
  };
}

export async function createCompanyUser(payload: CreateCompanyUserPayload): Promise<CompanyUser> {
  const res = await apiFetch(API_ROUTES.config.users, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as CompanyUser;
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const res = await apiFetch(API_ROUTES.config.userRoles(userId));
  return res.data as UserRole[];
}

export async function assignRoleToUser(userId: string, roleId: string): Promise<UserRole> {
  const res = await apiFetch(API_ROUTES.config.userRoles(userId), {
    method: 'POST',
    body: JSON.stringify({ role_id: roleId }),
  });
  return res.data as UserRole;
}

export async function removeRoleFromUser(userId: string, roleId: string): Promise<void> {
  await apiFetch(`${API_ROUTES.config.userRoles(userId)}/${roleId}`, {
    method: 'DELETE',
  });
}
