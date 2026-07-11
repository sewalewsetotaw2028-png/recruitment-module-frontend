import { apiFetch } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    organizationName: string;
    role: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const result = await apiFetch('/api/v1/candidates/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.user) {
        return result;
      }
      if (result.candidate) {
        return {
          token: result.token,
          user: {
            id: result.candidate.id,
            email: result.candidate.email,
            organizationId: result.user?.organizationId || '',
            organizationName: result.user?.organizationName || '',
            firstName: result.candidate.firstName || '',
            lastName: result.candidate.lastName || '',
            role: 'candidate',
          },
        };
      }
      throw new Error('Invalid auth response');
    } catch (candidateError) {
      const result = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return result;
    }
  },

  async register(data: RegisterData): Promise<void> {
    await apiFetch('/api/v1/candidates/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(token: string) {
    return apiFetch('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
