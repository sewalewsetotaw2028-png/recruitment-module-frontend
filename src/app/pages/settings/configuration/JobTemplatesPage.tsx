import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  fetchJobTemplates,
  createJobTemplate,
  updateJobTemplate,
  deleteJobTemplate,
  createJobDescription,
} from '@/hooks/useJobTemplates';
import type {
  JobTemplate,
  CreateJobTemplatePayload,
  UpdateJobTemplatePayload,
} from '@/hooks/useJobTemplates';
import { JobTemplateList } from '@/components/config/JobTemplateList';
import { JobTemplateDetail } from '@/components/config/JobTemplateDetail';
import { JobTemplateFormModal } from '@/components/config/JobTemplateFormModal';
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

export const JobTemplatesPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;
  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<JobTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<JobTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (preferredTemplateId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobTemplates();
      setTemplates(data);
      // Preserve the selected template after refresh so the editor context
      // stays anchored while admins save, version, or delete items.
      setSelectedTemplateId((current) => {
        if (preferredTemplateId && data.some((template) => template.id === preferredTemplateId)) {
          return preferredTemplateId;
        }
        if (current && data.some((template) => template.id === current)) {
          return current;
        }
        return data[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? null;

  const handleCreateTemplate = async (
    payload: CreateJobTemplatePayload | UpdateJobTemplatePayload,
  ) => {
    try {
      const newTemplate = await createJobTemplate(
        payload as CreateJobTemplatePayload,
      );
      await loadTemplates(newTemplate.id);
      setSelectedTemplateId(newTemplate.id);
      setShowAddModal(false);
      toast('Template created successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create template', 'error');
      throw err;
    }
  };

  const handleUpdateTemplate = async (
    payload: CreateJobTemplatePayload | UpdateJobTemplatePayload,
  ) => {
    if (!editingTemplate) return;
    try {
      await updateJobTemplate(
        editingTemplate.id,
        payload as UpdateJobTemplatePayload,
      );
      await loadTemplates(editingTemplate.id);
      setEditingTemplate(null);
      toast('Template updated successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update template', 'error');
      throw err;
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteJobTemplate(deletingTemplate.id);
      if (selectedTemplateId === deletingTemplate.id) setSelectedTemplateId(null);
      await loadTemplates(null);
      setDeletingTemplate(null);
      toast('Template deleted', 'success');
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete template',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTemplateDetail = async (payload: any) => {
    if (!selectedTemplate) return;
    await updateJobTemplate(selectedTemplate.id, payload);
    await loadTemplates(selectedTemplate.id);
    toast('Template updated successfully', 'success');
  };

  const handleCreateDescriptionVersion = async (payload: {
    title: string;
    summary?: string;
    responsibilities: string;
    requirements: string;
    employmentType: string;
    jobGrade?: string;
  }) => {
    if (!selectedTemplate) return;

    try {
      await createJobDescription(selectedTemplate.id, payload);
      await loadTemplates(selectedTemplate.id);
      toast('Template version created', 'success');
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Failed to create template version',
        'error',
      );
      throw err;
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
          Job Templates
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure reusable job templates for vacancy creation.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={() => loadTemplates()}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white">
          <JobTemplateList
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            loading={loading}
            onSelect={(t) => setSelectedTemplateId(t.id)}
            onAdd={() => setShowAddModal(true)}
            onEdit={(t) => setEditingTemplate(t)}
            onDelete={(t) => {
              setDeletingTemplate(t);
              setDeleteError(null);
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedTemplate ? (
            <JobTemplateDetail
              template={selectedTemplate}
              loading={loading}
              onSave={handleUpdateTemplateDetail}
              onCreateVersion={handleCreateDescriptionVersion}
              canWrite={canWrite}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  work
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Select a template from the sidebar to edit
              </p>
            </div>
          )}
        </div>
      </div>

      <JobTemplateFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        template={null}
        onSubmit={handleCreateTemplate}
      />

      <JobTemplateFormModal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
        onSubmit={handleUpdateTemplate}
      />

      <Modal
        isOpen={!!deletingTemplate}
        onClose={() => {
          setDeletingTemplate(null);
          setDeleteError(null);
        }}
        title="Delete Job Template"
        size="md"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Delete{' '}
              <span className="font-extrabold text-slate-900">
                {deletingTemplate?.title}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This removes the template from the active configuration list. It
              stays safe for existing vacancy references because the backend
              performs a soft delete.
            </p>
          </div>

          {deleteError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl animate-fade-in">
              <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">
                error
              </span>
              <p className="text-xs text-red-700 font-semibold leading-relaxed">
                {deleteError}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setDeletingTemplate(null);
                setDeleteError(null);
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Template'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default JobTemplatesPage;
