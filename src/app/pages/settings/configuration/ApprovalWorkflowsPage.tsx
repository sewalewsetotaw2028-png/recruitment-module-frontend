import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  fetchApprovalWorkflows,
  createApprovalWorkflow,
  updateApprovalWorkflow,
  updateApprovalWorkflowStages,
  deleteApprovalWorkflow,
} from '@/hooks/useApprovalWorkflows';
import { fetchRoles } from '@/hooks/useRolesConfig';
import type {
  ApprovalWorkflow,
  CreateApprovalWorkflowPayload,
  UpdateApprovalWorkflowPayload,
} from '@/hooks/useApprovalWorkflows';
import type { AppRole } from '@/hooks/useRolesConfig';
import { ApprovalWorkflowList } from '@/components/config/ApprovalWorkflowList';
import { ApprovalWorkflowDetail } from '@/components/config/ApprovalWorkflowDetail';
import { ApprovalWorkflowFormModal } from '@/components/config/ApprovalWorkflowFormModal';
import { Modal } from '@/components/ui/Modal';

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

interface DeleteDialogProps {
  workflow: ApprovalWorkflow | null;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  workflow,
  deleting,
  error,
  onConfirm,
  onCancel,
}) => (
  <Modal
    isOpen={!!workflow}
    onClose={onCancel}
    title="Delete Workflow"
    size="sm"
  >
      <div className="space-y-5 text-sm">
        <div className="flex items-start gap-3 p-4 bg-red-50/60 border border-red-200/60 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">
            warning
          </span>
          <div>
            <p className="text-xs font-bold text-red-800 leading-normal">
              Delete &ldquo;{workflow?.name}&rdquo;?
            </p>
            <p className="text-[11px] font-medium text-red-600 mt-1 leading-normal">
              This removes the workflow configuration itself. The current data
              model does not store a direct workflow reference on live approval
              records, so deletion is safe for configuration cleanup.
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
          id="confirm-delete-workflow"
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
              Deleting...
            </>
          ) : (
            'Delete Workflow'
          )}
        </button>
      </div>
    </div>
  </Modal>
);

export const ApprovalWorkflowsPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;
  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] =
    useState<ApprovalWorkflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] =
    useState<ApprovalWorkflow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadWorkflows = useCallback(async (preferredSelectedId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovalWorkflows();
      setWorkflows(data);
      setSelectedWorkflowId((current) => {
        const nextSelectedId =
          preferredSelectedId !== undefined ? preferredSelectedId : current;
        if (nextSelectedId && data.some((workflow) => workflow.id === nextSelectedId)) {
          return nextSelectedId;
        }
        return data[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch {
      // Non-fatal: role dropdowns will be empty, but the workflow list still works.
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
    loadRoles();
  }, [loadWorkflows, loadRoles]);

  const selectedWorkflow =
    workflows.find((w) => w.id === selectedWorkflowId) ?? null;

  const handleCreateWorkflow = async (
    payload: CreateApprovalWorkflowPayload | UpdateApprovalWorkflowPayload,
  ) => {
    try {
      const newWorkflow = await createApprovalWorkflow(
        payload as CreateApprovalWorkflowPayload,
      );
      await loadWorkflows(newWorkflow.id);
      setSelectedWorkflowId(newWorkflow.id);
      toast('Workflow created successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create workflow', 'error');
      throw err; // Let the modal show inline error too
    }
  };

  const handleUpdateWorkflow = async (
    payload: CreateApprovalWorkflowPayload | UpdateApprovalWorkflowPayload,
  ) => {
    if (!editingWorkflow) return;
    try {
      await updateApprovalWorkflow(
        editingWorkflow.id,
        payload as UpdateApprovalWorkflowPayload,
      );
      await loadWorkflows(editingWorkflow.id);
      toast('Workflow updated successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update workflow', 'error');
      throw err;
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!selectedWorkflow) return;
    await updateApprovalWorkflow(selectedWorkflow.id, { isActive });
    await loadWorkflows(selectedWorkflow.id);
    toast('Workflow status updated', 'success');
  };

  const handleSaveStages = async (
    stages: {
      stageOrder: number;
      stageName: string;
      approverRoleId?: string;
      isMandatory?: boolean;
    }[],
  ) => {
    if (!selectedWorkflow) return;
    try {
      await updateApprovalWorkflowStages(selectedWorkflow.id, { stages });
      await loadWorkflows(selectedWorkflow.id);
      toast('Workflow stages saved', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save stages', 'error');
      throw err;
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!deletingWorkflow) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteApprovalWorkflow(deletingWorkflow.id);
      setDeleteError(null);
      setDeletingWorkflow(null);
      await loadWorkflows(null);
      toast('Workflow deleted', 'success');
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete workflow',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm overflow-hidden">
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
          Approval Workflows
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure multi-stage approval chains for different entity types.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={loadWorkflows}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white sticky top-0">
          <ApprovalWorkflowList
            workflows={workflows}
            selectedWorkflowId={selectedWorkflowId}
            loading={loading}
            onSelect={(w) => setSelectedWorkflowId(w.id)}
            onAdd={() => setShowAddModal(true)}
            onEdit={(w) => setEditingWorkflow(w)}
            canWrite={canWrite}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedWorkflow ? (
            <ApprovalWorkflowDetail
              workflow={selectedWorkflow}
              loading={loading}
              roles={roles}
              rolesLoading={rolesLoading}
              onSave={handleToggleActive}
              onSaveStages={handleSaveStages}
              onDelete={() => {
                setDeleteError(null);
                setDeletingWorkflow(selectedWorkflow);
              }}
              canWrite={canWrite}
              onUnsavedCheck={() => {}}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  account_tree
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Select a workflow from the sidebar to view details
              </p>
            </div>
          )}
        </div>
      </div>

      <ApprovalWorkflowFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        workflow={null}
        roles={roles}
        rolesLoading={rolesLoading}
        onSubmit={handleCreateWorkflow}
      />

      <ApprovalWorkflowFormModal
        isOpen={!!editingWorkflow}
        onClose={() => setEditingWorkflow(null)}
        workflow={editingWorkflow}
        roles={roles}
        rolesLoading={rolesLoading}
        onSubmit={handleUpdateWorkflow}
      />

      <DeleteDialog
        workflow={deletingWorkflow}
        deleting={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteWorkflow}
        onCancel={() => {
          setDeletingWorkflow(null);
          setDeleteError(null);
        }}
      />
    </section>
  );
};

export default ApprovalWorkflowsPage;
