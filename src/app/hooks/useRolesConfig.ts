import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const CONFIG_ROUTES = {
  roles: `${API_V1}/config/roles`,
  roleById: (id: string) => `${API_V1}/config/roles/${id}`,
  rolePermissions: (id: string) => `${API_V1}/config/roles/${id}/permissions`,
  permissions: `${API_V1}/config/permissions`,
  userRoles: (userId: string) => `${API_V1}/config/users/${userId}/roles`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AppPermission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
}

export interface AppRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  /**
   * Permission slugs assigned to this role (Prompt 1/2 contract).
   * The matrix UI maps these slugs to the permission registry (id/description)
   * returned by GET /config/permissions.
   */
  permissions: string[];
}

export interface CreateRolePayload {
  name: string;
  slug: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchRoles(): Promise<AppRole[]> {
  const res = await apiFetch(CONFIG_ROUTES.roles);
  return res.data as AppRole[];
}

export async function fetchPermissions(): Promise<Record<string, AppPermission[]>> {
  const res = await apiFetch(CONFIG_ROUTES.permissions);
  return res.data as Record<string, AppPermission[]>;
}

export async function createRole(payload: CreateRolePayload): Promise<AppRole> {
  const res = await apiFetch(CONFIG_ROUTES.roles, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as AppRole;
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<AppRole> {
  const res = await apiFetch(CONFIG_ROUTES.roleById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as AppRole;
}

export async function deleteRole(id: string): Promise<void> {
  await apiFetch(CONFIG_ROUTES.roleById(id), { method: 'DELETE' });
}

export async function saveRolePermissions(
  roleId: string,
  permissionIds: string[],
): Promise<AppRole> {
  const res = await apiFetch(CONFIG_ROUTES.rolePermissions(roleId), {
    method: 'PUT',
    // Prompt 1/2 contract: { permission_ids: string[] }
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
  return res.data as AppRole;
}
