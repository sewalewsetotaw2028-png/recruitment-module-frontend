import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/state';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/common';
import { useSession } from '@/hooks/useSession';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface HeaderActionsProps {
  onNotificationsClick: () => void;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  onNotificationsClick,
}) => {
  const navigate = useNavigate();
  const { setActiveTab } = useApp();
  const { toast } = useToast();
  const { role } = useSession();
  const { can } = usePermissions();

  const canSeeSettings =
    role === 'recruiter' || role === 'hr' || role === 'hr_admin';
  const canSeeConfiguration = can(PERMISSIONS.CONFIG_MANAGE);

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
            className="hidden rounded-lg  px-3 py-2 text-white shadow-sm transition-all hover:bg-slate-200 md:flex"
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
          onClick={onNotificationsClick}
          className="icon-btn relative text-slate-700"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white" />
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
