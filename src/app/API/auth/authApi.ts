import { API_ROUTES } from '@/API/apiRoutes';
import { apiFetch } from '@/services/apiClient';

export const authApi = {
  me: (token: string) =>
    apiFetch(API_ROUTES.auth.me, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
