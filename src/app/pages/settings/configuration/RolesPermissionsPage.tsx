import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { useAppDispatch } from '@/hooks';
import { authActions } from '@/slice/authSlice';
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  saveRolePermissions,
} from '@/hooks/useRolesConfig';
import type {
  AppRole,
  AppPermission,
  CreateRolePayload,
  UpdateRolePayload,
} from '@/hooks/useRolesConfig';
import { RoleList } from '@/components/config/RoleList';
import { PermissionMatrix } from '@/components/config/PermissionMatrix';
import { RoleFormModal } from '@/components/config/RoleFormModal';
import { Modal } from '@/components/ui/Modal';

// ─── Hierarchy ordering ───────────────────────────────────────────────────────

// Power hierarchy: higher index = lower power, meaning these roles appear first
const ROLE_HIERARCHY: string[] = [
  'super_admin',
  'admin',
  'ceo',
  'coo',
  'cto',
  'cfo',
  'vp',
  'director',
  'manager',
  'team_lead',
  'lead',
  'senior',
  'hr_admin',
  'hr_manager',
  'hr',
  'recruiter',
  'interviewer',
  'department_head',
  'department',
  'employee',
  'candidate',
  'guest',
  'viewer',
];

function getRoleHierarchyScore(role: AppRole): number {
  const nameLower = role.name.toLowerCase().replace(/[\s-]/g, '_');
  const slugLower = role.slug.toLowerCase().replace(/[\s-]/g, '_');
  const idx = ROLE_HIERARCHY.findIndex(
    (h) => nameLower.includes(h) || slugLower.includes(h),
  );
  // System roles with admin / super-admin get priority
  if (role.is_system && idx === -1) return 5;
  return idx === -1 ? 999 : idx;
}

function sortRolesByHierarchy(roles: AppRole[]): AppRole[] {
  return [...roles].sort((a, b) => {
    const diff = getRoleHierarchyScore(a) - getRoleHierarchyScore(b);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

// ─── Access Denied fallback ───────────────────────────────────────────────────

const AccessDenied = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto my-12 animate-fade-in text-sm">
    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center shadow-xs">
      <span className="material-symbols-outlined text-red-500 text-xl">
        lock
      </span>
    </div>
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
      <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
        You don't have permission to access configuration settings. Contact your
        HR Administrator.
      </p>
    </div>
  </div>
);

// ─── Delete confirmation dialog ───────────────────────────────────────────────

interface DeleteDialogProps {
  role: AppRole | null;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
  error?: string | null;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  role,
  onConfirm,
  onCancel,
  deleting,
  error,
}) => (
  <Modal isOpen={!!role} onClose={onCancel} title="Delete Role" size="sm">
    <div className="space-y-5 text-sm">
      <div className="flex items-start gap-3 p-4 bg-red-50/60 border border-red-200/60 rounded-xl">
        <span className="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">
          warning
        </span>
        <div>
          <p className="text-xs font-bold text-red-800 leading-normal">
            Are you sure you want to delete the role &ldquo;{role?.name}&rdquo;?
          </p>
          <p className="text-[11px] font-medium text-red-600 mt-1 leading-normal">
            This cannot be undone. Roles currently assigned to users cannot be
            deleted.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200/60 rounded-xl px-3.5 py-2.5 font-semibold leading-relaxed">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
        >
          Cancel
        </button>
        <button
          id="confirm-delete-role"
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-100 disabled:text-red-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
        >
          {deleting ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin leading-none">
                progress_activity
              </span>
              Deleting…
            </>
          ) : (
            'Delete Role'
          )}
        </button>
      </div>
    </div>
  </Modal>
);

// ─── Discard changes confirmation ─────────────────────────────────────────────

interface DiscardDialogProps {
  isOpen: boolean;
  onDiscard: () => void;
  onStay: () => void;
}

const DiscardDialog: React.FC<DiscardDialogProps> = ({
  isOpen,
  onDiscard,
  onStay,
}) => (
  <Modal isOpen={isOpen} onClose={onStay} title="Unsaved Changes" size="sm">
    <div className="space-y-5 text-sm">
      <p className="text-xs font-medium text-slate-600 leading-relaxed">
        You have unsaved permission changes. If you switch roles now, your
        modifications will be permanently lost.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onStay}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
        >
          Stay &amp; Save
        </button>
        <button
          id="discard-changes-btn"
          type="button"
          onClick={onDiscard}
          className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
        >
          Discard Changes
        </button>
      </div>
    </div>
  </Modal>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export const RolesPermissionsPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // ── Permission guard ──────────────────────────────────────────────────────
  // Configuration in this system is guarded by a single permission: config:manage.
  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;

  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  // ── State ─────────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<
    Record<string, AppPermission[]>
  >({});
  const [rolesLoading, setRolesLoading] = useState(true);
  const [permsLoading, setPermsLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Pending role click when we have unsaved changes
  const pendingRoleRef = useRef<AppRole | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<AppRole | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const data = await fetchRoles();
      const sorted = sortRolesByHierarchy(data);
      setRoles(sorted);
      // Auto-select first role
      if (sorted.length > 0 && !selectedRoleId) {
        setSelectedRoleId(sorted[0].id);
      }
    } catch (err: unknown) {
      setRolesError(
        err instanceof Error ? err.message : 'Failed to load roles',
      );
    } finally {
      setRolesLoading(false);
    }
  }, [selectedRoleId]);

  const loadPermissions = useCallback(async () => {
    setPermsLoading(true);
    try {
      const data = await fetchPermissions();
      setAllPermissions(data);
    } catch {
      // non-fatal — matrix will just be empty
    } finally {
      setPermsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles, loadPermissions]);

  // ── Selected role object ──────────────────────────────────────────────────
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  // ── Role selection with unsaved-changes guard ─────────────────────────────
  const handleRoleSelect = (role: AppRole) => {
    if (role.id === selectedRoleId) return;
    if (hasUnsaved) {
      pendingRoleRef.current = role;
      setShowDiscardDialog(true);
      return;
    }
    setSelectedRoleId(role.id);
  };

  const handleDiscardConfirm = () => {
    setHasUnsaved(false);
    setShowDiscardDialog(false);
    if (pendingRoleRef.current) {
      setSelectedRoleId(pendingRoleRef.current.id);
      pendingRoleRef.current = null;
    }
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreateRole = async (
    payload: CreateRolePayload | UpdateRolePayload,
  ) => {
    const newRole = await createRole(payload as CreateRolePayload);
    await loadRoles();
    setSelectedRoleId(newRole.id);
    toast('Role created successfully', 'success');
  };

  const handleUpdateRole = async (
    payload: CreateRolePayload | UpdateRolePayload,
  ) => {
    if (!editingRole) return;
    await updateRole(editingRole.id, payload as UpdateRolePayload);
    await loadRoles();
    toast('Role updated successfully', 'success');
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRole(deletingRole.id);
      if (selectedRoleId === deletingRole.id) setSelectedRoleId(null);
      await loadRoles();
      setDeletingRole(null);
      toast('Role deleted', 'success');
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete role',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePermissions = async (permissionIds: string[]) => {
    if (!selectedRoleId) return;
    const updated = await saveRolePermissions(selectedRoleId, permissionIds);
    // Update the role in our local list so originalIds updates correctly
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    // Refresh the user's session to apply permission changes immediately without reload
    dispatch(authActions.silentGetMeRequest());
    toast('Permissions saved successfully', 'success');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm overflow-hidden">
      {/* Page header — always visible, never scrolls */}
      <div className="border-b border-slate-200 px-6 py-5 select-none shrink-0 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/dashboard/configuration"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to Hub
          </Link>
        </div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
          Configuration
        </p>
        <h1 className="text-xl font-extrabold text-slate-800 mt-1 tracking-tight">
          Role Management
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Manage company roles and their access permissions. System roles cannot
          be deleted.
        </p>
      </div>

      {/* Error banner */}
      {rolesError && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{rolesError}</span>
          <button
            onClick={loadRoles}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Split panel body — fills remaining height ── */}
      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">

        {/* ── Left — Role sidebar panel ── */}
        {/*
          This column is its own scroll context. It fills the full height of
          the parent flex row and scrolls internally. The parent has
          overflow-hidden so nothing bleeds out.
        */}
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white sticky top-0">
          <RoleList
            roles={roles}
            selectedRoleId={selectedRoleId}
            loading={rolesLoading}
            onSelect={handleRoleSelect}
            canWrite={canWrite}
            onAdd={() => setShowAddModal(true)}
            onEdit={(role) => setEditingRole(role)}
            onDelete={(role) => {
              setDeletingRole(role);
              setDeleteError(null);
            }}
          />
        </div>

        {/* ── Right — Permission matrix ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedRole ? (
            <PermissionMatrix
              role={selectedRole}
              allPermissions={allPermissions}
              loading={permsLoading}
              onSave={handleSavePermissions}
              onUnsavedCheck={setHasUnsaved}
              canWrite={canWrite}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  manage_accounts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Select a role from the sidebar to modify its permissions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Add Role */}
      <RoleFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        role={null}
        onSubmit={handleCreateRole}
      />

      {/* Edit Role */}
      <RoleFormModal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        role={editingRole}
        onSubmit={handleUpdateRole}
      />

      {/* Delete confirmation */}
      <DeleteDialog
        role={deletingRole}
        onConfirm={handleDeleteRole}
        onCancel={() => {
          setDeletingRole(null);
          setDeleteError(null);
        }}
        deleting={isDeleting}
        error={deleteError}
      />

      {/* Discard changes confirmation */}
      <DiscardDialog
        isOpen={showDiscardDialog}
        onDiscard={handleDiscardConfirm}
        onStay={() => {
          setShowDiscardDialog(false);
          pendingRoleRef.current = null;
        }}
      />
    </section>
  );
};

export default RolesPermissionsPage;
