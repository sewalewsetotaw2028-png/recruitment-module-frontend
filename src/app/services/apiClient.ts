// Simple fetch wrapper used as a starting point for services/apiClient
const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export async function apiFetch(path: string, options: RequestInit = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const rawToken = localStorage.getItem('token');
  const token =
    rawToken && rawToken !== 'undefined' && rawToken !== 'null'
      ? rawToken
      : null;
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(base + path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const errorText = await res.text();
    let errorMessage = 'An error occurred';
    try {
      const parsed = JSON.parse(errorText);
      const baseMessage = parsed.message || parsed.error || errorText;
      const fieldErrors = Array.isArray(parsed.errors)
        ? parsed.errors
            .map((item: any) => {
              const field = item?.field ? `${item.field}: ` : '';
              return `${field}${item?.message || ''}`.trim();
            })
            .filter(Boolean)
        : [];

      errorMessage = fieldErrors.length
        ? `${baseMessage}${baseMessage ? '\n' : ''}${fieldErrors.join('\n')}`
        : baseMessage;
    } catch {
      errorMessage = stripHtml(errorText) || res.statusText || 'An error occurred';
    }
    const error = new Error(errorMessage);
    (error as Error & { status?: number; details?: string }).status = res.status;
    (error as Error & { status?: number; details?: string }).details = errorText;
    throw error;
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  if (!text.trim()) {
    return null;
  }
  return JSON.parse(text);
}

export default apiFetch;
