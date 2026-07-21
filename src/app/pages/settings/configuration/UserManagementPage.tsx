import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { fetchRoles } from '@/hooks/useRolesConfig';
import type { AppRole } from '@/hooks/useRolesConfig';
import {
  fetchCompanyUsers,
  createCompanyUser,
  assignRoleToUser,
  removeRoleFromUser,
} from '@/hooks/useUsersConfig';
import type { CompanyUser, PaginationMeta } from '@/hooks/useUsersConfig';
import { Modal } from '@/components/ui/Modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase();

const PAGE_SIZES = [10, 20, 50];

// ─── Access Denied ────────────────────────────────────────────────────────────

const AccessDenied = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto my-12 animate-fade-in text-sm">
    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center shadow-xs">
      <span className="material-symbols-outlined text-red-500 text-xl">lock</span>
    </div>
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
      <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
        You don't have permission to access configuration settings. Contact your HR Administrator.
      </p>
    </div>
  </div>
);

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-200 rounded w-32" />
          <div className="h-2.5 bg-slate-100 rounded w-44" />
        </div>
      </div>
    </td>
    <td className="px-4 py-3.5">
      <div className="flex gap-1.5">
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="h-5 w-14 bg-slate-100 rounded-full" />
      </div>
    </td>
    <td className="px-4 py-3.5"><div className="h-5 w-12 bg-slate-100 rounded-full" /></td>
    <td className="px-4 py-3.5"><div className="h-6 w-16 bg-slate-100 rounded-lg ml-auto" /></td>
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserManagementPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;

  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  // ── Table / Pagination State ────────────────────────────────────────────────
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ── Roles State ─────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // ── Create User Modal State ─────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Edit Roles Modal State ──────────────────────────────────────────────────
  const [editUser, setEditUser] = useState<CompanyUser | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Debounce timer ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data Loading ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(
    async (currentPage: number, currentLimit: number, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchCompanyUsers({ page: currentPage, limit: currentLimit, search });
        setUsers(res.users);
        setPagination(res.pagination);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch {
      // non-fatal
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(page, limit, activeSearch);
  }, [page, limit, activeSearch, loadUsers]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // ── Search debounce ─────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setActiveSearch(val.trim());
    }, 400);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setPage(1);
    setActiveSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // ── Pagination Helpers ──────────────────────────────────────────────────────
  const goToPage = (p: number) => {
    if (p < 1 || p > pagination.pages) return;
    setPage(p);
  };

  const buildPageNumbers = () => {
    const total = pagination.pages;
    const current = page;
    const delta = 2;
    const range: (number | '...')[] = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push('...');
    if (total > 1) range.push(total);
    return range;
  };

  // ── Create User ─────────────────────────────────────────────────────────────
  const resetCreateForm = () => {
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewPassword('');
    setShowPassword(false);
    setSelectedRoleIds([]);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoleIds.length === 0) {
      toast('At least one role must be assigned', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createCompanyUser({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        password: newPassword,
        roleIds: selectedRoleIds,
      });
      resetCreateForm();
      setShowAddModal(false);
      toast('User created successfully', 'success');
      // Reload current page
      await loadUsers(page, limit, activeSearch);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit User Roles ─────────────────────────────────────────────────────────
  const openEditModal = (user: CompanyUser) => {
    setEditUser({ ...user, roles: [...user.roles] });
  };

  const handleEditAddRole = async (roleId: string) => {
    if (!editUser) return;
    const roleToAdd = roles.find((r) => r.id === roleId);
    if (!roleToAdd) return;

    setEditSaving(true);
    try {
      await assignRoleToUser(editUser.id, roleId);
      setEditUser((prev) =>
        prev
          ? {
              ...prev,
              roles: [...prev.roles, roleToAdd as any],
            }
          : prev,
      );
      toast('Role assigned', 'success');
      // Keep the edit modal open but refresh the table row in background
      const res = await fetchCompanyUsers({ page, limit, search: activeSearch });
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to assign role', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditRemoveRole = async (roleId: string) => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      await removeRoleFromUser(editUser.id, roleId);
      setEditUser((prev) =>
        prev ? { ...prev, roles: prev.roles.filter((r) => r.id !== roleId) } : prev,
      );
      toast('Role removed', 'success');
      const res = await fetchCompanyUsers({ page, limit, search: activeSearch });
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to remove role', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const availableRolesForEdit = editUser
    ? roles.filter((r) => !editUser.roles.some((ur) => ur.id === r.id))
    : [];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm bg-slate-50/20">
      {/* Page Header */}
      <div className="border-b border-slate-200 px-6 py-5 select-none shrink-0 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/dashboard/configuration"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Hub
          </Link>
        </div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
          Configuration
        </p>
        <h1 className="text-xl font-extrabold text-slate-800 mt-1 tracking-tight">
          User Management
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Create internal users, assign roles, and manage access credentials across your organisation.
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 shrink-0 bg-white border-b border-slate-100 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] leading-none pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] leading-none">close</span>
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 select-none">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 shadow-xs transition"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>

        {/* Add user */}
        {canWrite && (
          <button
            id="add-user-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">person_add</span>
            New User
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">error</span>
          <span className="font-bold">{error}</span>
          <button
            onClick={() => loadUsers(page, limit, activeSearch)}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table container */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 w-[40%]">
                  User
                </th>
                <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Roles
                </th>
                <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: limit > 10 ? 8 : 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400 select-none">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-slate-300">
                          group
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        {activeSearch
                          ? `No users match "${activeSearch}"`
                          : 'No company users found. Create one to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const initials = getInitials(user.first_name, user.last_name);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* User column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[11px] text-indigo-600 shrink-0 select-none">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 select-all">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roles column */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-[11px] italic text-slate-400">No roles</span>
                          ) : (
                            user.roles.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {r.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Status column */}
                      <td className="px-4 py-3.5">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions column */}
                      <td className="px-4 py-3.5 text-right">
                        {canWrite && (
                          <button
                            id={`edit-user-${user.id}`}
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold border border-slate-200 rounded-lg bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-xs focus:outline-none cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[14px] leading-none">
                              edit
                            </span>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && pagination.pages > 0 && (
          <div className="mt-4 flex items-center justify-between gap-4 select-none">
            {/* Info */}
            <p className="text-[11px] font-semibold text-slate-500 shrink-0">
              Showing{' '}
              <span className="font-extrabold text-slate-700">
                {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)}
              </span>{' '}
              of <span className="font-extrabold text-slate-700">{pagination.total}</span> users
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none cursor-pointer transition shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  chevron_left
                </span>
              </button>

              {buildPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-slate-400 text-xs font-bold"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`min-w-[30px] h-[30px] rounded-lg text-xs font-bold transition focus:outline-none cursor-pointer border shadow-xs ${
                      p === page
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              {/* Next */}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === pagination.pages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none cursor-pointer transition shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create User Modal ──────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetCreateForm();
          }}
          title="Create New User"
          size="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">First Name *</label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Last Name *</label>
                <input
                  type="text"
                  required
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg leading-none select-none">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Must be at least 8 characters.
              </p>
            </div>

            {/* Roles Checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Assign Role(s) * <span className="text-slate-400 font-normal">(at least one)</span>
              </label>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                {rolesLoading ? (
                  <p className="text-xs text-slate-400 italic">Loading roles…</p>
                ) : roles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No roles configured in system.</p>
                ) : (
                  roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoleIds([...selectedRoleIds, role.id]);
                          } else {
                            setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      />
                      <span>{role.name}</span>
                      {role.description && (
                        <span className="text-slate-400 font-normal text-[10px] truncate">
                          — {role.description}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetCreateForm();
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedRoleIds.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-100 disabled:text-indigo-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin leading-none">
                      progress_activity
                    </span>
                    Creating…
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────────────── */}
      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title="Edit User"
          size="md"
        >
          <div className="space-y-5 text-sm">
            {/* User card */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-extrabold text-sm text-indigo-600 select-none shrink-0">
                {getInitials(editUser.first_name, editUser.last_name)}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-800 text-sm">
                  {editUser.first_name} {editUser.last_name}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate select-all">
                  {editUser.email}
                </p>
              </div>
              <div className="ml-auto shrink-0">
                {editUser.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Assigned Roles */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-extrabold text-slate-800 tracking-tight">
                  Assigned Roles
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Roles define what this user can see and do across the application.
                </p>
              </div>

              {editUser.roles.length === 0 ? (
                <div className="p-4 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  No roles assigned yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editUser.roles.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {r.name}
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => handleEditRemoveRole(r.id)}
                          disabled={editSaving}
                          className="p-0.5 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-800 transition-all focus:outline-none cursor-pointer leading-none disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Remove role ${r.name}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Add role dropdown */}
              {canWrite && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                    Assign New Role
                  </p>
                  {availableRolesForEdit.length === 0 ? (
                    <p className="text-xs italic text-slate-400">
                      All available roles have been assigned to this user.
                    </p>
                  ) : (
                    <select
                      value=""
                      disabled={editSaving}
                      onChange={(e) => {
                        if (e.target.value) handleEditAddRole(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Select a role to assign…
                      </option>
                      {availableRolesForEdit.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {editSaving && (
                    <p className="text-[10px] text-indigo-500 font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] animate-spin leading-none">
                        progress_activity
                      </span>
                      Saving…
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer focus:outline-none"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default UserManagementPage;
