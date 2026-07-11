import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { AppPermission, AppRole } from '@/hooks/useRolesConfig';

interface PermissionMatrixProps {
  role: AppRole;
  allPermissions: Record<string, AppPermission[]>;
  loading: boolean;
  onSave: (permissionIds: string[]) => Promise<void>;
  onUnsavedCheck: (hasChanges: boolean) => void;
  canWrite: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  role,
  allPermissions,
  loading,
  onSave,
  onUnsavedCheck,
  canWrite,
}) => {
  // Track toggled permission IDs
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Search and filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Collapsible module tracking (false = expanded, true = collapsed)
  const [collapsedModules, setCollapsedModules] = useState<
    Record<string, boolean>
  >({});

  const slugToId = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(allPermissions).forEach((perms) => {
      perms.forEach((p) => map.set(p.slug, p.id));
    });
    return map;
  }, [allPermissions]);

  // Initialize from role permission slugs
  useEffect(() => {
    const ids = role.permissions
      .map((slug) => slugToId.get(slug))
      .filter((x): x is string => !!x);
    setEnabled(new Set(ids));
    setSaveError(null);
  }, [role.id, role.permissions, slugToId]);

  const originalIds = useMemo(
    () =>
      new Set(
        role.permissions
          .map((slug) => slugToId.get(slug))
          .filter((x): x is string => !!x),
      ),
    [role.id, role.permissions, slugToId],
  );

  const hasChanges = useMemo(() => {
    if (enabled.size !== originalIds.size) return true;
    for (const id of enabled) {
      if (!originalIds.has(id)) return true;
    }
    return false;
  }, [enabled, originalIds]);

  useEffect(() => {
    onUnsavedCheck(hasChanges);
  }, [hasChanges, onUnsavedCheck]);

  const togglePermission = useCallback((permId: string, isChecked: boolean) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      isChecked ? next.add(permId) : next.delete(permId);
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(Array.from(enabled));
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save permissions',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setEnabled(new Set(originalIds));
    setSaveError(null);
  };

  const modules = useMemo(
    () => Object.keys(allPermissions).sort(),
    [allPermissions],
  );

  // Filter permissions dynamically based on module selector and search query
  const filteredPermissions = useMemo(() => {
    const result: Record<string, AppPermission[]> = {};
    Object.entries(allPermissions).forEach(([moduleName, perms]) => {
      // Filter by selected module dropdown
      if (selectedModule !== 'all' && selectedModule !== moduleName) return;

      // Filter by search query
      const matched = perms.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      });

      if (matched.length > 0) {
        result[moduleName] = matched.sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      }
    });
    return result;
  }, [allPermissions, searchQuery, selectedModule]);

  const toggleModuleCollapse = (moduleName: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  // Quick action: Grant all permissions inside a specific module
  const handleGrantAllInModule = (moduleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const perms = allPermissions[moduleName] || [];
    setEnabled((prev) => {
      const next = new Set(prev);
      perms.forEach((perm) => {
        next.add(perm.id);
      });
      return next;
    });
  };

  // Quick action: Revoke all permissions inside a specific module
  const handleRevokeAllInModule = (moduleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const perms = allPermissions[moduleName] || [];
    setEnabled((prev) => {
      const next = new Set(prev);
      perms.forEach((perm) => {
        next.delete(perm.id);
      });
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 text-sm">

      {/* ── Sticky Top Toolbar — always visible even when scrolling ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-3.5 space-y-3">
        {/* Row 1: role name + unsaved badge + action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                Role Management Matrix
              </p>
              {role.is_system && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider select-none">
                  System Role
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mt-0.5 leading-tight">
              {role.name}
            </h3>
            {role.description && (
              <p className="text-xs font-medium text-slate-400 mt-0.5 leading-relaxed">
                {role.description}
              </p>
            )}
          </div>

          {/* Save / Revert action buttons — always on top */}
          {canWrite && (
            <div className="flex items-center gap-2 shrink-0">
              {hasChanges && (
                <>
                  <span className="hidden sm:flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg select-none">
                    <span className="material-symbols-outlined text-sm leading-none">
                      warning
                    </span>
                    Unsaved
                  </span>
                  <button
                    id="revert-permissions-btn"
                    type="button"
                    onClick={handleRevert}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-extrabold text-slate-600 rounded-lg transition-all shadow-xs focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px] leading-none">
                      undo
                    </span>
                    Revert
                  </button>
                </>
              )}
              <button
                id="save-permissions-btn"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-extrabold text-white rounded-lg transition-all shadow-sm shrink-0 focus:outline-none cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin leading-none">
                      progress_activity
                    </span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px] leading-none">
                      save
                    </span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Row 2: search + module filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
            />
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all capitalize shadow-xs cursor-pointer"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Save error */}
        {saveError && (
          <p className="text-xs text-red-600 font-extrabold bg-red-50 border border-red-200/60 px-3 py-2 rounded-lg">
            {saveError}
          </p>
        )}
      </div>

      {/* ── Scrollable permission list ── */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30 p-4 space-y-3">
        {loading ? (
          <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-4 animate-pulse">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-7 bg-slate-100 rounded-lg w-16" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b border-slate-50"
              >
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-5 bg-slate-100 rounded-full w-10" />
              </div>
            ))}
          </div>
        ) : Object.keys(filteredPermissions).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
            <span className="material-symbols-outlined text-3xl mb-2 text-slate-300">
              search_off
            </span>
            <p className="text-xs font-semibold">
              No matching permissions found
            </p>
          </div>
        ) : (
          Object.entries(filteredPermissions).map(([moduleName, perms]) => {
            const isCollapsed = !!collapsedModules[moduleName];

            // Calculate enabled permissions in this module
            const totalInModule = perms.length;
            const enabledInModule = perms.filter((p) =>
              enabled.has(p.id),
            ).length;

            return (
              <div
                key={moduleName}
                className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Collapsible Section Header */}
                <div
                  onClick={() => toggleModuleCollapse(moduleName)}
                  className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-50 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-slate-400 text-lg transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    >
                      expand_more
                    </span>
                    <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                      {moduleName.replace(/_/g, ' ')}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        enabledInModule === totalInModule
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : enabledInModule > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {enabledInModule} / {totalInModule} Enabled
                    </span>
                  </div>

                  {/* Quick Bulk Actions */}
                  {canWrite && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleGrantAllInModule(moduleName, e)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Grant All
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRevokeAllInModule(moduleName, e)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Revoke All
                      </button>
                    </div>
                  )}
                </div>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="flex flex-col divide-y divide-slate-100 bg-white">
                    {perms.map((perm) => {
                      const isChecked = enabled.has(perm.id);

                      return (
                        <div
                          key={perm.id}
                          onClick={() =>
                            canWrite && togglePermission(perm.id, !isChecked)
                          }
                          className={`flex items-center justify-between px-5 py-3.5 transition-all gap-4 select-none ${
                            canWrite
                              ? 'cursor-pointer hover:bg-slate-50/60'
                              : 'cursor-not-allowed opacity-80'
                          }`}
                        >
                          {/* Permission info block */}
                          <div className="flex-1 min-w-0">
                            <span className="font-extrabold text-slate-700 tracking-wide text-xs block">
                              {perm.name}
                            </span>
                            {perm.description && (
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-normal">
                                {perm.description}
                              </p>
                            )}
                          </div>

                          {/* Allowed / Denied pill */}
                          <div className="shrink-0 flex items-center justify-end">
                            <span
                              className={`inline-flex items-center justify-center text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider transition-colors shadow-2xs border ${
                                isChecked
                                  ? 'bg-indigo-600 text-white border-transparent'
                                  : 'bg-slate-50 text-slate-400 border-slate-200/60'
                              }`}
                            >
                              {isChecked ? 'Allowed' : 'Denied'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PermissionMatrix;
