import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  EvaluationTemplate,
  UpdateEvaluationTemplatePayload,
  CreateEvaluationTemplatePayload,
} from '@/hooks/useEvaluationTemplates';
import type { InterviewCategory } from '@/hooks/useInterviewCategories';

interface EvaluationTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: EvaluationTemplate | null;
  interviewCategories: InterviewCategory[];
  onSubmit: (
    payload:
      | CreateEvaluationTemplatePayload
      | UpdateEvaluationTemplatePayload,
  ) => Promise<void>;
}

export const EvaluationTemplateFormModal: React.FC<
  EvaluationTemplateFormModalProps
> = ({ isOpen, onClose, template, interviewCategories, onSubmit }) => {
  const isEditMode = !!template;

  const [name, setName] = useState('');
  const [interviewCategoryId, setInterviewCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(template?.name ?? '');
    setInterviewCategoryId(template?.interview_category_id ?? '');
    setIsActive(template?.is_active ?? true);
    setError(null);
  }, [isOpen, template]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: UpdateEvaluationTemplatePayload = {
          name: name.trim(),
          interviewCategoryId: interviewCategoryId || undefined,
          isActive,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateEvaluationTemplatePayload = {
          name: name.trim(),
          interviewCategoryId: interviewCategoryId || undefined,
          criteria: [],
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Evaluation Template' : 'Create Evaluation Template'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Interview"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Interview Category
          </label>
          <select
            value={interviewCategoryId}
            onChange={(e) => setInterviewCategoryId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          >
            <option value="">No category</option>
            {interviewCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">
            This links the template to a category loaded from the interview categories settings.
          </p>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-xs font-semibold text-slate-700">
                Active
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl animate-fade-in">
            <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">
              error
            </span>
            <p className="text-xs text-red-700 font-semibold leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="evaluation-template-form-submit"
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin leading-none">
                  progress_activity
                </span>
                Saving...
              </>
            ) : isEditMode ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EvaluationTemplateFormModal;
