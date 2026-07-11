import {
  mapApiUserToAuthUser,
  type ApiUserPayload,
} from '@/utils/apiMappers';
import type { AuthLoginApiResponse } from '@/slice/authSlice/types';

export function parseLoginResponse(response: AuthLoginApiResponse) {
  const token = response.token;
  if (!token) return null;

  const raw =
    response.user ?? response.candidate ?? response.data?.user;
  if (!raw) return null;

  return {
    token,
    refreshToken: response.refreshToken,
    user: mapApiUserToAuthUser(raw as ApiUserPayload),
  };
}
