import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

interface Props {
  open: boolean;
  onClose: () => void;
}

const getTypeIcon = (type: string): string => {
  if (type.startsWith('WORKFORCE_PLAN')) return 'event_seat';
  if (type.startsWith('RECRUITMENT_REQUEST')) return 'assignment';
  if (type.startsWith('VACANCY') || type === 'JOB_POSTED') return 'work';
  if (type.startsWith('APPLICATION')) return 'description';
  if (type.startsWith('INTERVIEW')) return 'calendar_today';
  if (type.startsWith('CANDIDATE') || type.startsWith('OFFER')) return 'person';
  if (type.startsWith('TALENT_ROSTER')) return 'badge';
  return 'notifications';
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
  return date.toLocaleDateString();
};

export const NotificationsPanel: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (open) {
      fetchNotifications({ limit: 10 });
    }
  }, [open, fetchNotifications]);

  if (!open) return null;

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} aria-hidden />
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
              >
                Mark all read
              </button>
            )}
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close">
              <span className="material-symbols-outlined text-slate-500">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">notifications_off</span>
              <p className="text-slate-500 font-medium">No notifications yet</p>
              <p className="text-slate-400 text-sm mt-1">When you get notifications, they'll appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotificationClick(n.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 ${!n.is_read ? 'bg-indigo-50/60' : ''}`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-lg">{getTypeIcon(n.type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                    {!n.is_read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message.replace(/<[^>]*>/g, '')}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{getRelativeTime(n.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dashboard/notifications');
            }}
            className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            View all notifications
          </button>
        </div>
      </aside>
    </>
  );
};
