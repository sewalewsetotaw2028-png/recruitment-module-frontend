import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { Modal } from '@/components/ui/Modal';
import { usePermissions } from '@/hooks/usePermissions';
import { fetchInterviewCategories } from '@/hooks/useInterviewCategories';
import type { InterviewCategory } from '@/hooks/useInterviewCategories';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  createEvaluationTemplate,
  deleteEvaluationTemplate,
  fetchEvaluationTemplates,
  updateEvaluationTemplate,
} from '@/hooks/useEvaluationTemplates';
import type {
  CreateEvaluationTemplatePayload,
  EvaluationCriteria,
  EvaluationTemplate,
  UpdateEvaluationTemplatePayload,
} from '@/hooks/useEvaluationTemplates';
import { EvaluationTemplateList } from '@/components/config/EvaluationTemplateList';
import { EvaluationTemplateDetail } from '@/components/config/EvaluationTemplateDetail';
import { EvaluationTemplateFormModal } from '@/components/config/EvaluationTemplateFormModal';

// New templates start with the standard 40/30/30 split so the create flow
// can bootstrap a valid template before the admin customizes the criteria.
// Uses snake_case field names to match the backend API.
const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria[] = [
  { name: 'Technical Skills', weight: 40, max_score: 10, order: 1 },
  { name: 'Communication', weight: 30, max_score: 10, order: 2 },
  { name: 'Cultural Fit', weight: 30, max_score: 10, order: 3 },
];

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

export const EvaluationTemplatesPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  // Compute access before any conditional returns so hooks are never skipped.
  const hasAccess = can(PERMISSIONS.CONFIG_MANAGE);
  const canWrite = hasAccess;

  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [interviewCategories, setInterviewCategories] = useState<
    InterviewCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<
    EvaluationTemplate | null
  >(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<EvaluationTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (preferredTemplateId?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchEvaluationTemplates();
      setTemplates(data);
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

  const loadInterviewCategories = useCallback(async () => {
    try {
      const data = await fetchInterviewCategories();
      setInterviewCategories(data);
    } catch (err: unknown) {
      toast(
        err instanceof Error
          ? err.message
          : 'Failed to load interview categories',
        'error',
      );
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    loadInterviewCategories();
  }, [loadInterviewCategories]);

  // Guard after all hooks — safe to return early here.
  if (!hasAccess) return <AccessDenied />;

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;
  const selectedCategoryLabel =
    interviewCategories.find(
      (category) => category.id === selectedTemplate?.interview_category_id,
    )?.name ?? null;

  const handleCreateTemplate = async (
    payload: CreateEvaluationTemplatePayload | UpdateEvaluationTemplatePayload,
  ) => {
    const created = await createEvaluationTemplate({
      name: payload.name?.trim() ?? '',
      interviewCategoryId: payload.interviewCategoryId,
      criteria: DEFAULT_EVALUATION_CRITERIA,
    });
    await loadTemplates(created.id);
    setShowCreateModal(false);
    toast('Template created successfully', 'success');
  };

  const handleEditTemplate = (template: EvaluationTemplate) => {
    setSelectedTemplateId(template.id);
    setEditingTemplate(template);
    setDeleteError(null);
  };

  const handleUpdateTemplateMeta = async (
    payload: CreateEvaluationTemplatePayload | UpdateEvaluationTemplatePayload,
  ) => {
    if (!editingTemplate) return;

    await updateEvaluationTemplate(
      editingTemplate.id,
      payload as UpdateEvaluationTemplatePayload,
    );
    await loadTemplates(editingTemplate.id);
    setEditingTemplate(null);
    toast('Template updated successfully', 'success');
  };

  const handleUpdateTemplate = async (
    payload: UpdateEvaluationTemplatePayload & {
      criteria?: EvaluationCriteria[];
    },
  ) => {
    if (!selectedTemplate) return;

    await updateEvaluationTemplate(selectedTemplate.id, payload);
    await loadTemplates(selectedTemplate.id);
    toast('Template updated successfully', 'success');
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteEvaluationTemplate(deletingTemplate.id);
      await loadTemplates(deletingTemplate.id);
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
          Evaluation Templates
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure interview evaluation criteria and scoring weights.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={() => loadTemplates(selectedTemplateId)}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white">
          <EvaluationTemplateList
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            loading={loading}
            onSelect={(template) => setSelectedTemplateId(template.id)}
            onAdd={() => setShowCreateModal(true)}
            onEdit={handleEditTemplate}
            onDelete={(template) => {
              setDeletingTemplate(template);
              setDeleteError(null);
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedTemplate ? (
            <EvaluationTemplateDetail
              template={selectedTemplate}
              loading={loading}
              onSave={handleUpdateTemplate}
              canWrite={canWrite}
              categoryLabel={selectedCategoryLabel}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  fact_check
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Select a template from the sidebar to edit
              </p>
            </div>
          )}
        </div>
      </div>

      <EvaluationTemplateFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        template={null}
        interviewCategories={interviewCategories}
        onSubmit={handleCreateTemplate}
      />

      <EvaluationTemplateFormModal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
        interviewCategories={interviewCategories}
        onSubmit={handleUpdateTemplateMeta}
      />

      <Modal
        isOpen={!!deletingTemplate}
        onClose={() => {
          setDeletingTemplate(null);
          setDeleteError(null);
        }}
        title="Delete Evaluation Template"
        size="md"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Delete{' '}
              <span className="font-extrabold text-slate-900">
                {deletingTemplate?.name}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              If this template is already linked to interview evaluations, the
              API will reject the delete request and we will keep the error
              visible here.
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

export default EvaluationTemplatesPage;
