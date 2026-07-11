import React, { useEffect, useState } from 'react';
import type { InterviewCategory } from '@/hooks/useInterviewCategories';

interface InterviewCategoryDetailProps {
  category: InterviewCategory;
  loading: boolean;
  onSave: (payload: any) => Promise<void>;
  canWrite: boolean;
}

export const InterviewCategoryDetail: React.FC<InterviewCategoryDetailProps> = ({
  category,
  loading,
  onSave,
  canWrite,
}) => {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
  const [isDefault, setIsDefault] = useState(category.is_default);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(category.name);
    setDescription(category.description || '');
    setIsDefault(category.is_default);
  }, [category]);

  const handleSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name,
        description,
        isDefault,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
              {category.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Interview category configuration
            </p>
          </div>

          {canWrite && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin leading-none">
                    progress_activity
                  </span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canWrite}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canWrite}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-none"
          />
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={category.is_default}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed"
              />
              <span className="text-xs font-semibold text-slate-700">
                Default Category
              </span>
            </label>
            {category.is_default && (
              <span className="text-[10px] text-slate-400">
                (Cannot be changed)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewCategoryDetail;
