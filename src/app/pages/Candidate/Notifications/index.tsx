import React, { useEffect, useState, useCallback } from 'react';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type { NotificationItem } from '@/hooks/useNotifications';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTypeIcon = (type: string): string => {
  const t = type?.toUpperCase() || '';
  if (t.startsWith('INTERVIEW') || t.startsWith('APPLICATION')) return 'calendar_today';
  if (t.startsWith('OFFER') || t.startsWith('CANDIDATE_SELECTED')) return 'local_offer';
  if (t.startsWith('APPLICATION_RECEIVED')) return 'description';
  if (t.startsWith('APPLICATION_SHORTLISTED')) return 'done_all';
  if (t.includes('REJECT') || t.includes('REGRET')) return 'cancel';
  if (t.startsWith('TALENT_ROSTER')) return 'badge';
  return 'notifications';
};

const getTypeColor = (type: string): string => {
  const t = type?.toUpperCase() || '';
  if (t.startsWith('INTERVIEW')) return 'bg-cyan-100 text-cyan-700';
  if (t.startsWith('OFFER') || t.startsWith('CANDIDATE_SELECTED')) return 'bg-emerald-100 text-emerald-700';
  if (t.startsWith('APPLICATION_RECEIVED') || t.startsWith('APPLICATION_SHORTLISTED')) return 'bg-blue-100 text-blue-700';
  if (t.includes('REJECT') || t.includes('REGRET')) return 'bg-rose-100 text-rose-700';
  if (t.startsWith('TALENT_ROSTER')) return 'bg-purple-100 text-purple-700';
  return 'bg-slate-100 text-slate-700';
};

const getRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTypeLabel = (type: string): string => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

// ─── Detail Modal ───────────────────────────────────────────────────────────

interface DetailModalProps {
  notification: NotificationItem | null;
  onClose: () => void;
}

const NotificationDetailModal: React.FC<DetailModalProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[80]" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(notification.type)}`}>
                <span className="material-symbols-outlined">{getTypeIcon(notification.type)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Notification Details</h3>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  {formatTypeLabel(notification.type)}
                </span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Message</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {stripHtml(notification.message)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Received</p>
                <p className="text-xs text-slate-600">
                  {new Date(notification.created_at).toLocaleString(undefined, {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  notification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${notification.is_read ? 'bg-slate-400' : 'bg-indigo-500'}`} />
                  {notification.is_read ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>

            {(notification.related_entity_type || notification.related_entity_id) && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Related To</p>
                <p className="text-xs text-slate-500">
                  {notification.related_entity_type
                    ? `${formatTypeLabel(notification.related_entity_type)}: ${notification.related_entity_id || '—'}`
                    : notification.related_entity_id || '—'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Filter Chip ────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
        active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// ─── Main Page ──────────────────────────────────────────────────────────────

export const CandidateNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [detailNotification, setDetailNotification] = useState<NotificationItem | null>(null);
  const [markingLoading, setMarkingLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeCall<any[]>({
        method: 'GET',
        route: API_ROUTES.candidates.notifications,
        isSecureRoute: true,
      });
      const raw = Array.isArray(res.data)
        ? res.data
        : ((res.data as any)?.data || []);

      const mapped: NotificationItem[] = raw.map((n: any) => ({
        id: n.id,
        type: n.type || 'GENERAL',
        title: n.title || '',
        message: n.message || '',
        is_read: n.is_read ?? false,
        created_at: n.created_at || new Date().toISOString(),
        read_at: n.read_at || null,
        related_entity_type: n.related_entity_type || null,
        related_entity_id: n.related_entity_id || null,
      }));

      setNotifications(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /** Tell the header badge to refresh immediately */
  const notifyHeaderRefresh = () => {
    window.dispatchEvent(new CustomEvent('notification:updated'));
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingLoading(true);
      await makeCall({
        method: 'PATCH',
        route: API_ROUTES.candidates.markAllNotificationsRead,
        isSecureRoute: true,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      notifyHeaderRefresh();
    } catch {
      // silent
    } finally {
      setMarkingLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await makeCall({
        method: 'PATCH',
        route: API_ROUTES.candidates.markNotificationRead(id),
        isSecureRoute: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      notifyHeaderRefresh();
    } catch {
      // silent
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    setDetailNotification(item);
    if (!item.is_read) {
      await handleMarkRead(item.id);
    }
  };

  // Filtering
  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (selectedType) {
      const typeGroup = n.type.split('_')[0] || 'OTHER';
      if (typeGroup !== selectedType) return false;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Type group counts for filter chips
  const typeCounts = notifications.reduce<Record<string, number>>((acc, n) => {
    const typeGroup = n.type.split('_')[0] || 'OTHER';
    acc[typeGroup] = (acc[typeGroup] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-shell max-w-4xl mx-auto">
      {/* Detail Modal */}
      <NotificationDetailModal
        notification={detailNotification}
        onClose={() => setDetailNotification(null)}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-sm text-slate-500 mt-1">
              Stay updated on your application status, interview schedules, and offers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <FilterChip
          label="All"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={notifications.length}
        />
        <FilterChip
          label="Unread"
          active={filter === 'unread'}
          onClick={() => setFilter('unread')}
          count={unreadCount}
        />
        <div className="w-px h-6 bg-slate-200 mx-1" />
        {Object.entries(typeCounts).slice(0, 6).map(([type, count]) => (
          <FilterChip
            key={type}
            label={formatTypeLabel(type)}
            active={selectedType === type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            count={count}
          />
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading notifications...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-400 text-3xl">notifications_off</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No notifications</h3>
            <p className="text-sm text-slate-400 mt-1">
              {filter === 'unread'
                ? 'You have no unread notifications.'
                : 'No notifications yet. They\'ll appear here when you receive updates.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNotificationClick(item)}
                className={`w-full text-left p-4 md:p-5 transition-all hover:bg-slate-50 flex gap-4 ${
                  !item.is_read
                    ? 'bg-indigo-50/40 border-l-2 border-l-indigo-500'
                    : 'border-l-2 border-l-transparent'
                }`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(item.type)}`}>
                  <span className="material-symbols-outlined">{getTypeIcon(item.type)}</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm ${!item.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="inline-block mt-0.5 text-[11px] font-medium text-indigo-600 uppercase tracking-wide">
                          New
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {getRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                    {stripHtml(item.message)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">
            Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
            {unreadCount > 0 && ` (${unreadCount} unread)`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CandidateNotificationsPage;
