import React, { useMemo, useState } from 'react';
import type { AppRole } from '@/hooks/useRolesConfig';

interface RoleListProps {
  roles: AppRole[];
  selectedRoleId: string | null;
  loading: boolean;
  canWrite: boolean;
  onSelect: (role: AppRole) => void;
  onAdd: () => void;
  onEdit: (role: AppRole) => void;
  onDelete: (role: AppRole) => void;
}

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  selectedRoleId,
  loading,
  canWrite,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return roles;

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(query) ||
        role.slug.toLowerCase().includes(query) ||
        (role.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [roles, searchQuery]);

  return (
    /**
     * The parent column in RolesPermissionsPage is already a flex column with
     * full height. This component fills it completely:
     * - The header stays pinned so the active role context remains visible.
     * - The role list below it scrolls independently and can be searched.
     */
    <div className="flex flex-col h-full min-h-0 text-sm">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white select-none shrink-0 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Roles
          </h3>
          <button
            id="add-role-btn"
            onClick={onAdd}
            disabled={!canWrite}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              add
            </span>
            New Role
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              Currently editing
            </p>
            {selectedRole ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider truncate max-w-[140px]">
                {selectedRole.name}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-50 text-slate-400 border border-slate-200 uppercase tracking-wider">
                None
              </span>
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles..."
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded-md w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded-md w-1/2" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
          ))
        ) : filteredRoles.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 font-medium italic bg-white border border-slate-100 rounded-xl shadow-xs">
            {searchQuery.trim()
              ? 'No roles match your search.'
              : 'No roles found.'}
          </div>
        ) : (
          filteredRoles.map((role) => {
            const isSelected = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                id={`role-item-${role.id}`}
                onClick={() => onSelect(role)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all cursor-pointer group focus:outline-none rounded-xl border ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wide truncate transition-colors ${
                        isSelected
                          ? 'text-indigo-600'
                          : 'text-slate-700 group-hover:text-indigo-600'
                      }`}
                    >
                      {role.name}
                    </span>
                    {role.is_system && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/40 uppercase tracking-wider select-none">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate leading-relaxed">
                      {role.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[12px] text-slate-400 leading-none">
                      key
                    </span>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {role.permissions.length} permissions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canWrite && !role.is_system && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`edit-role-${role.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(role);
                        }}
                        className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                        title="Edit role"
                      >
                        <span className="material-symbols-outlined text-[15px] block">
                          edit
                        </span>
                      </button>
                      <button
                        id={`delete-role-${role.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(role);
                        }}
                        className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                        title="Delete role"
                      >
                        <span className="material-symbols-outlined text-[15px] block">
                          delete
                        </span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] block">
                      group
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoleList;
