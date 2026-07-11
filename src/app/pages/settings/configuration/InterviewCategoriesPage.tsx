import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { Modal } from '@/components/ui/Modal';
import {
  fetchInterviewCategories,
  createInterviewCategory,
  updateInterviewCategory,
  deleteInterviewCategory,
} from '@/hooks/useInterviewCategories';
import type {
  InterviewCategory,
  CreateInterviewCategoryPayload,
  UpdateInterviewCategoryPayload,
} from '@/hooks/useInterviewCategories';
import { InterviewCategoryList } from '@/components/config/InterviewCategoryList';
import { InterviewCategoryDetail } from '@/components/config/InterviewCategoryDetail';
import { InterviewCategoryFormModal } from '@/components/config/InterviewCategoryFormModal';

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

export const InterviewCategoriesPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  // Compute access before any conditional returns so hooks are never skipped.
  const hasAccess = can(PERMISSIONS.CONFIG_MANAGE);
  const canWrite = hasAccess;

  const [categories, setCategories] = useState<InterviewCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<InterviewCategory | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<InterviewCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = useCallback(async (preferredCategoryId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInterviewCategories();
      setCategories(data);
      // Preserve the selected category after refresh so the right panel keeps
      // the same context while an admin edits or deletes a category.
      setSelectedCategoryId((current) => {
        if (preferredCategoryId && data.some((category) => category.id === preferredCategoryId)) {
          return preferredCategoryId;
        }
        if (current && data.some((category) => category.id === current)) {
          return current;
        }
        return data[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Guard after all hooks — safe to return early here.
  if (!hasAccess) return <AccessDenied />;

  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? null;

  const handleCreateCategory = async (
    payload: CreateInterviewCategoryPayload | UpdateInterviewCategoryPayload,
  ) => {
    try {
      const newCategory = await createInterviewCategory(
        payload as CreateInterviewCategoryPayload,
      );
      await loadCategories(newCategory.id);
      setSelectedCategoryId(newCategory.id);
      setShowAddModal(false);
      toast('Category created successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create category', 'error');
      throw err;
    }
  };

  const handleUpdateCategory = async (
    payload: CreateInterviewCategoryPayload | UpdateInterviewCategoryPayload,
  ) => {
    if (!editingCategory) return;
    try {
      await updateInterviewCategory(
        editingCategory.id,
        payload as UpdateInterviewCategoryPayload,
      );
      await loadCategories(editingCategory.id);
      setEditingCategory(null);
      toast('Category updated successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update category', 'error');
      throw err;
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteInterviewCategory(deletingCategory.id);
      if (selectedCategoryId === deletingCategory.id) setSelectedCategoryId(null);
      await loadCategories(null);
      setDeletingCategory(null);
      toast('Category deleted', 'success');
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete category',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateCategoryDetail = async (payload: any) => {
    if (!selectedCategory) return;
    try {
      await updateInterviewCategory(selectedCategory.id, payload);
      await loadCategories(selectedCategory.id);
      toast('Category updated successfully', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update category', 'error');
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
          Interview Categories
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure interview categories for organizing different types of
          interviews.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={() => loadCategories()}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white">
          <InterviewCategoryList
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            loading={loading}
            onSelect={(c) => setSelectedCategoryId(c.id)}
            onAdd={() => setShowAddModal(true)}
            onEdit={(c) => setEditingCategory(c)}
            onDelete={(c) => {
              setDeletingCategory(c);
              setDeleteError(null);
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedCategory ? (
            <InterviewCategoryDetail
              category={selectedCategory}
              loading={loading}
              onSave={handleUpdateCategoryDetail}
              canWrite={canWrite}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  category
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Select a category from the sidebar to edit
              </p>
            </div>
          )}
        </div>
      </div>

      <InterviewCategoryFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        category={null}
        onSubmit={handleCreateCategory}
      />

      <InterviewCategoryFormModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSubmit={handleUpdateCategory}
      />

      <Modal
        isOpen={!!deletingCategory}
        onClose={() => {
          setDeletingCategory(null);
          setDeleteError(null);
        }}
        title="Delete Interview Category"
        size="md"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Delete{' '}
              <span className="font-extrabold text-slate-900">
                {deletingCategory?.name}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This category can only be deleted when no active interview evaluation template references it.
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
                setDeletingCategory(null);
                setDeleteError(null);
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Category'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default InterviewCategoriesPage;
