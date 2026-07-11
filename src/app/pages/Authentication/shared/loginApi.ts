import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type { AuthLoginApiResponse } from '@/slice/authSlice/types';
import type { LoginPayload } from '@/slice/authSlice/types';

export async function postLogin(
  route: string,
  payload: LoginPayload,
): Promise<AuthLoginApiResponse | null> {
  try {
    const { data } = await makeCall<AuthLoginApiResponse>({
      method: 'POST',
      route,
      body: { email: payload.email, password: payload.password },
      isSecureRoute: false,
    });
    return data;
  } catch {
    return null;
  }
}

export async function loginWithFallback(
  payload: LoginPayload,
): Promise<AuthLoginApiResponse | null> {
  let response = await postLogin(API_ROUTES.candidates.login, payload);
  if (!response?.token) {
    response = await postLogin(API_ROUTES.auth.login, payload);
  }
  return response;
}
