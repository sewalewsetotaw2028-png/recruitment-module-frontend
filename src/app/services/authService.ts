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
    isEmailVerified?: boolean;
  };
}

export const authService = {
  /**
   * Verify a user's or candidate's email address using a verification token.
   * @param token - The email verification token
   * @param userType - 'user' or 'candidate'
   */
  async verifyEmail(token: string, userType: string): Promise<{ message: string }> {
    const result = await apiFetch('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token, userType }),
    });
    return result?.data || result;
  },

  /**
   * Resend the email verification email.
   * @param email - The email address to resend verification to
   * @param userType - 'user' or 'candidate'
   */
  async resendVerification(email: string, userType: string): Promise<{ message: string }> {
    const result = await apiFetch('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email, userType }),
    });
    return result?.data || result;
  },

  /**
   * Request a magic link for passwordless sign-in.
   * @param email - The email address to send the magic link to
   */
  async requestMagicLink(email: string): Promise<{ message: string }> {
    const result = await apiFetch('/api/v1/auth/email-signin', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return result?.data || result;
  },

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
            organizationId: result.candidate.company_id || result.user?.organizationId || '',
            organizationName: result.candidate.company_name || result.user?.organizationName || '',
            firstName: result.candidate.firstName || result.candidate.first_name || '',
            lastName: result.candidate.lastName || result.candidate.last_name || '',
            role: 'candidate',
            isEmailVerified: result.candidate.is_email_verified ?? false,
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
