import React, { useEffect, useState } from 'react';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';
import { PRIMARY_COLOR_HEX } from '@/config/theme';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const CandidateNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeCall<Notification[]>({
        method: 'GET',
        route: API_ROUTES.candidates.notifications,
        isSecureRoute: true,
      });
      const list = Array.isArray(res.data)
        ? res.data
        : ((res.data as any)?.data || []);
      setNotifications(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setMarking(true);
      await makeCall({
        method: 'POST',
        route: API_ROUTES.candidates.markAllNotificationsRead,
        isSecureRoute: true,
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true })),
      );
    } catch {
      // silent fail — notification state will refresh on next load
    } finally {
      setMarking(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await makeCall({
        method: 'POST',
        route: API_ROUTES.candidates.markNotificationRead(id),
        isSecureRoute: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      // silent fail
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'INTERVIEW_SCHEDULED':
        return 'calendar_today';
      case 'OFFER_ISSUED':
        return 'local_offer';
      case 'APPLICATION_STATUS':
        return 'work';
      case 'REGRET':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'INTERVIEW_SCHEDULED':
        return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'OFFER_ISSUED':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'REGRET':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      default:
        return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased space-y-6">
      <PageSectionHeader
        eyebrow="Candidate Portal"
        title="Notifications"
        description="Stay updated on your application status, interview schedules, and offers."
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-sm">
          <div
            className="w-10 h-10 rounded-full animate-spin mx-auto"
            style={{
              border: `3px solid #e2e8f0`,
              borderTopColor: PRIMARY_COLOR_HEX,
            }}
          />
          <p className="text-slate-500 text-sm font-medium">Loading notifications…</p>
        </div>
      ) : (
        <>
          {/* Header action row */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All notifications read'}
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={marking}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <span className="material-symbols-outlined text-slate-300 text-4xl block">
                notifications_off
              </span>
              <p className="text-slate-400 text-sm font-medium">
                No notifications yet
              </p>
              <p className="text-slate-300 text-xs">
                You'll be notified about interview schedules, offer letters, and application updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`bg-white border rounded-2xl p-4 shadow-sm transition-all duration-200 ${
                    n.is_read
                      ? 'border-slate-200/60 opacity-70'
                      : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getTypeColor(
                        n.type,
                      )}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {getTypeIcon(n.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-bold tracking-tight ${
                            n.is_read ? 'text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-300 font-mono mt-1 block">
                        {new Date(n.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CandidateNotificationsPage;
