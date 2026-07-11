import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { roleDisplayName } from '@/utils/roleUtils';

export const HeaderUserInfo: React.FC = () => {
  const { user, logout } = useAuth();
  const { role } = useSession();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'User';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <img
        alt=""
        className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=fff`}
      />
      <div className="hidden min-w-0 text-left xl:block">
        <p className="truncate text-sm font-semibold leading-tight text-slate-900">
          {displayName}
        </p>
        <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">
          {roleDisplayName(role)}
        </p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
        title="Sign out"
        aria-label="Sign out"
      >
        <span className="material-symbols-outlined text-[22px]">logout</span>
      </button>
    </div>
  );
};
