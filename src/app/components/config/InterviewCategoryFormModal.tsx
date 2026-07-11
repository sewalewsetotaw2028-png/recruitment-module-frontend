import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  InterviewCategory,
  CreateInterviewCategoryPayload,
  UpdateInterviewCategoryPayload,
} from '@/hooks/useInterviewCategories';

interface InterviewCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: InterviewCategory | null;
  onSubmit: (
    payload: CreateInterviewCategoryPayload | UpdateInterviewCategoryPayload,
  ) => Promise<void>;
}

export const InterviewCategoryFormModal: React.FC<
  InterviewCategoryFormModalProps
> = ({ isOpen, onClose, category, onSubmit }) => {
  const isEditMode = !!category;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
      setIsDefault(category?.is_default ?? false);
      setError(null);
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: UpdateInterviewCategoryPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          isDefault,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateInterviewCategoryPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          isDefault,
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
      title={isEditMode ? 'Edit Interview Category' : 'Add New Interview Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Technical Interview"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional: describe this interview category..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs resize-none text-xs leading-relaxed"
          />
        </div>

        {!isEditMode && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-xs font-semibold text-slate-700">
                Set as Default
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl animate-fade-in">
            <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">
              error
            </span>
            <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
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
            id="category-form-submit"
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin leading-none">
                  progress_activity
                </span>
                Saving…
              </>
            ) : isEditMode ? (
              'Update Category'
            ) : (
              'Create Category'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InterviewCategoryFormModal;
