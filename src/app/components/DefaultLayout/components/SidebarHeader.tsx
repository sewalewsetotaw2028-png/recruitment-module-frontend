import React from 'react';
import type { UserRole } from '@/state/appContext.types';
import { roleDisplayName } from '@/utils/roleUtils';

interface SidebarHeaderProps {
  role: UserRole;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  role,
}) => {
  const portalLabel =
    role === 'candidate'
      ? 'Careers portal'
      : `${roleDisplayName(role)} workspace`;

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 pb-4 pt-6">
      <img
        src="/adiu-logo.jpg"
        alt="Adiu"
        className="h-10 w-10 shrink-0 shadow-sm rounded-xl object-contain"
      />
      <div className="min-w-0">
        <h1 className="text-base font-bold text-slate-900 truncate">Adiu</h1>
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 truncate">
          {portalLabel}
        </p>
      </div>
    </div>
  );
};
