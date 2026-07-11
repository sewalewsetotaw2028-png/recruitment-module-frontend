import React from 'react';
import type { UserRole } from '@/state/appContext.types';
import { roleDisplayName } from '@/utils/roleUtils';

interface SidebarHeaderProps {
  role: UserRole;
  onClose: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  role,
  onClose,
}) => {
  const portalLabel =
    role === 'candidate'
      ? 'Careers portal'
      : `${roleDisplayName(role)} workspace`;

  return (
    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 pb-4 pt-6">
      <div className="flex items-center gap-3 min-w-0">
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
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        aria-label="Close menu"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
};
