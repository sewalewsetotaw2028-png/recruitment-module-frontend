import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface SidebarFooterProps {
  onNavClick: (path: string) => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ onNavClick }) => {
  const location = useLocation();
  const { role, user } = useSession();
  const permissions = user?.permissions || [];

  const hasSettingsAccess = role === 'candidate' || 
    permissions.includes(PERMISSIONS.CONFIG_MANAGE);
  
  const hasConfigAccess = permissions.includes(PERMISSIONS.CONFIG_MANAGE);

  const settingsPath = role === 'candidate' ? '/dashboard/candidate-settings' : '/dashboard/settings';
  const configPath = '/dashboard/configuration';

  const isSettingsActive = location.pathname === settingsPath || 
    (settingsPath !== '/dashboard/settings' && location.pathname.startsWith(settingsPath));
  const isConfigActive = location.pathname === configPath || 
    location.pathname.startsWith(configPath);

  return (
    <div className="border-t border-slate-100 bg-white px-3 py-3 space-y-1 shrink-0">
      {hasSettingsAccess && (
        <button
          type="button"
          onClick={() => onNavClick(settingsPath)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
            isSettingsActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{
              fontVariationSettings: isSettingsActive ? "'FILL' 1" : undefined,
            }}
          >
            settings
          </span>
          <span>Settings</span>
        </button>
      )}
      {hasConfigAccess && (
        <button
          type="button"
          onClick={() => onNavClick(configPath)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
            isConfigActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{
              fontVariationSettings: isConfigActive ? "'FILL' 1" : undefined,
            }}
          >
            tune
          </span>
          <span>Configuration</span>
        </button>
      )}
    </div>
  );
};
