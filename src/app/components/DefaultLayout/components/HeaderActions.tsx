import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/state';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/common';
import { useSession } from '@/hooks/useSession';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { useNotifications } from '@/hooks/useNotifications';

export const HeaderActions: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveTab } = useApp();
  const { toast } = useToast();
  const { role } = useSession();
  const { can } = usePermissions();
  const { unreadCount, startPolling, stopPolling } = useNotifications(role === 'candidate');

  const canSeeSettings =
    role === 'recruiter' || role === 'hr' || role === 'hr_admin';
  const canSeeConfiguration = can(PERMISSIONS.CONFIG_MANAGE);

  // Poll every 8 seconds for near-real-time badge updates
  React.useEffect(() => {
    startPolling(8000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const goTo = (path: string, tab: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-4">
      <div className="flex items-center gap-1 border-r border-outline-variant pr-2 md:pr-4">
        {canSeeSettings && (
          <button
            type="button"
            onClick={() => goTo('/dashboard/settings', 'settings')}
            className="hidden rounded-lg px-3 py-2 text-white shadow-sm transition-all hover:bg-slate-200 md:flex"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        )}
        {canSeeConfiguration && (
          <button
            type="button"
            onClick={() => goTo('/dashboard/configuration', 'configuration')}
            className="hidden rounded-lg px-3 py-2 text-white shadow-sm transition-all hover:bg-indigo-200 md:flex"
            aria-label="Configuration"
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (role === 'candidate') {
              setActiveTab('notifications');
              navigate('/dashboard/candidate-notifications');
            } else {
              navigate('/dashboard/notifications');
            }
          }}
          className="icon-btn relative text-slate-700 transition-all hover:text-indigo-600"
          aria-label="Notifications"
        >
          <span className={`material-symbols-outlined transition-all ${
            unreadCount > 0
              ? 'text-indigo-600' 
              : 'text-slate-500'
          }`}>
            {unreadCount > 0 ? 'notifications_active' : 'notifications'}
          </span>
          {/* Always show badge — red with count when >0, subdued with "0" when none */}
          <span className={`absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow-sm transition-all ${
            unreadCount > 0
              ? 'bg-red-500 text-white'
              : 'bg-slate-200 text-slate-400'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() =>
            toast(
              'Adiu Help: contact support@adiu.et or +251 11 000 0000.',
              'info',
            )
          }
          className="icon-btn hidden text-slate-700 sm:flex"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>
    </div>
  );
};
