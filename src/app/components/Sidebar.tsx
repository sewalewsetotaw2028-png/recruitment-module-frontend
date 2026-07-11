import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/state';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { useSession } from '@/hooks/useSession';
import { SidebarHeader, SidebarNav } from '@/components/DefaultLayout/components';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
}) => {
  const { role } = useSession();
  const { can } = usePermissions();
  const { setActiveTab } = useApp();
  const navigate = useNavigate();

  const openRoute = (path: string, tab: string) => {
    setActiveTab(tab);
    navigate(path);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <SidebarHeader role={role} onClose={() => onClose?.()} />
      <SidebarNav
        onNavClick={(path) => {
          navigate(path);
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            onClose?.();
          }
        }}
      />

      <div className="mt-auto border-t border-slate-100 p-3 shadow-black">
        <div className="grid gap-2">
          {(role === 'recruiter' || role === 'hr' || role === 'hr_admin') && (
            <button
              type="button"
              onClick={() => openRoute('/dashboard/settings', 'settings')}
              className="flex items-center gap-3 rounded-xl border border-slate-900 px-3 py-2 text-left text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-600"
            >
              <span className="material-symbols-outlined text-[20px]">
                settings
              </span>
              <span className="truncate">Settings</span>
            </button>
          )}
          {can(PERMISSIONS.CONFIG_MANAGE) && (
            <button
              type="button"
              onClick={() =>
                openRoute('/dashboard/configuration', 'configuration')
              }
              className="flex items-center gap-3 rounded-xl border border-indigo-700 px-3 py-2 text-left text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-600"
            >
              <span className="material-symbols-outlined text-[20px]">
                tune
              </span>
              <span className="truncate">Configuration</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
