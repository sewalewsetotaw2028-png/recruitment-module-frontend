import apiFetch from '@/services/apiClient';

export { API_ROUTES } from './apiRoutes';

export interface ApiCallConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  route: string;
  body?: unknown;
  data?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  isSecureRoute?: boolean;
}

function buildUrl(route: string, query?: ApiCallConfig['query']): string {
  if (!query || Object.keys(query).length === 0) return route;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${route}?${qs}` : route;
}

/**
 * Guide-style API caller. Returns axios-like `{ data }` for sagas.
 */
export default async function makeCall<T = unknown>(
  config: ApiCallConfig,
): Promise<{ data: T }> {
  const { method, route, body, data, query } = config;
  const url = buildUrl(route, query);

  const options: RequestInit = { method };

  const payload = body ?? data;
  if (payload !== undefined && method !== 'GET') {
    options.body =
      payload instanceof FormData ? payload : JSON.stringify(payload);
  }

  const raw = await apiFetch(url, options);
  return { data: raw as T };
}

export { apiFetch };
export { makeCall };
