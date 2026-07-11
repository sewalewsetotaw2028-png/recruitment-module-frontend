export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  organizationName?: string;
  role: string;
  roleSlug?: string;
  permissions?: string[];
  departmentId?: string;
  departmentName?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName?: string;
}

import type { ApiUserPayload } from '@/utils/apiMappers';

export interface AuthLoginApiResponse {
  status?: string;
  token: string;
  refreshToken?: string;
  user?: ApiUserPayload;
  candidate?: ApiUserPayload;
  data?: { user?: ApiUserPayload };
}

export interface AuthMeApiResponse {
  status?: string;
  data: ApiUserPayload;
}
