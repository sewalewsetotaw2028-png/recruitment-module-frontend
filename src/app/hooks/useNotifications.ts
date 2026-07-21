import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread_count: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing notifications — fetching, polling, marking as read.
 * Set candidateMode=true for candidate-facing API endpoints.
 */
export function useNotifications(candidateMode = false) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Base endpoints differ for candidate vs staff
  const unreadCountEndpoint = candidateMode
    ? `${API_V1}/candidates/me/notifications/unread-count`
    : `${API_V1}/notifications/unread-count`;
  const notificationsEndpoint = candidateMode
    ? `${API_V1}/candidates/me/notifications`
    : `${API_V1}/notifications`;
  const markReadEndpoint = (id: string) =>
    candidateMode
      ? `${API_V1}/candidates/me/notifications/${id}/read`
      : `${API_V1}/notifications/${id}/read`;
  const markAllReadEndpoint = candidateMode
    ? `${API_V1}/candidates/me/notifications/read-all`
    : `${API_V1}/notifications/read-all`;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch(unreadCountEndpoint);
      const data = res?.data as { count: number } | undefined;
      if (data && typeof data.count === 'number') {
        setState((prev) => ({ ...prev, unreadCount: data.count }));
      }
    } catch {
      // Silent fail on polling errors
    }
  }, [unreadCountEndpoint]);

  const fetchNotifications = useCallback(
    async (filters?: { is_read?: boolean; page?: number; limit?: number }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (filters?.is_read !== undefined) params.set('is_read', String(filters.is_read));
        if (filters?.page) params.set('page', String(filters.page));
        if (filters?.limit) params.set('limit', String(filters.limit));
        const qs = params.toString();
        const url = `${notificationsEndpoint}${qs ? `?${qs}` : ''}`;

        const res = await apiFetch(url);
        const responseData = res?.data as NotificationsResponse | undefined;

        if (responseData) {
          setState({
            notifications: responseData.notifications || [],
            unreadCount: responseData.unread_count ?? 0,
            loading: false,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (err: any) {
        setState({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: err?.message || 'Failed to load notifications',
        });
      }
    },
    [notificationsEndpoint],
  );

  /** Dispatch a custom DOM event so HeaderActions (separate hook instance) knows to refresh */
  const notifyUpdated = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notification:updated'));
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(markReadEndpoint(id), { method: 'PATCH' });
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
      notifyUpdated();
    } catch {
      // Silent fail
    }
  }, [markReadEndpoint, notifyUpdated]);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiFetch(markAllReadEndpoint, { method: 'PATCH' });
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
      notifyUpdated();
    } catch {
      // Silent fail
    }
  }, [markAllReadEndpoint, notifyUpdated]);

  const startPolling = useCallback(
    (intervalMs = 8000) => {
      if (pollingRef.current) return;
      fetchUnreadCount();
      pollingRef.current = setInterval(() => {
        fetchUnreadCount();
      }, intervalMs);
    },
    [fetchUnreadCount],
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Listen for 'notification:updated' events from other hook instances
  useEffect(() => {
    const handler = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notification:updated', handler);
    return () => window.removeEventListener('notification:updated', handler);
  }, [fetchUnreadCount]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  };
}
