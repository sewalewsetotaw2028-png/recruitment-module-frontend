import React from 'react';
import { useApp } from '@/state';
import { useSession } from '@/hooks/useSession';
import { getNotificationsForRole } from '@/data/notifications';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<Props> = ({ open, onClose }) => {
  const { setActiveTab } = useApp();
  const { role } = useSession();
  const items = getNotificationsForRole(role);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} aria-hidden />
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-primary">Notifications</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container-low" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y">
          {items.length === 0 ? (
            <p className="p-8 text-center text-on-surface-variant">No notifications.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (n.actionTab) setActiveTab(n.actionTab);
                  onClose();
                }}
                className={`w-full text-left p-4 hover:bg-surface-container-low flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <span className="material-symbols-outlined text-primary shrink-0">{n.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-sm">{n.title}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{n.body}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{n.time}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
};
