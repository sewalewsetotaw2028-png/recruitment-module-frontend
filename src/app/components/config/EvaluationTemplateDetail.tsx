import React, { useEffect, useMemo, useState } from 'react';
import type {
  EvaluationCriteria,
  EvaluationTemplate,
  UpdateEvaluationTemplatePayload,
} from '@/hooks/useEvaluationTemplates';

interface EvaluationTemplateDetailProps {
  template: EvaluationTemplate;
  loading: boolean;
  onSave: (
    payload: UpdateEvaluationTemplatePayload & { criteria?: EvaluationCriteria[] },
  ) => Promise<void>;
  canWrite: boolean;
  categoryLabel?: string | null;
}

const normalizeCriteria = (criteria: EvaluationCriteria[]) =>
  criteria.map((criterion, index) => ({
    name: (criterion.name ?? '').trim(),
    weight: Math.min(100, Math.max(0, Number(criterion.weight ?? 0))),
    maxScore: Math.max(1, Number(criterion.maxScore ?? 10)),
    order: Math.max(1, Number(criterion.order ?? index + 1)),
  }));

export const EvaluationTemplateDetail: React.FC<
  EvaluationTemplateDetailProps
> = ({ template, loading, onSave, canWrite, categoryLabel }) => {
  const [name, setName] = useState(template.name);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(
    normalizeCriteria(template.criteria),
  );
  const [isActive, setIsActive] = useState(template.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(template.name);
    setCriteria(normalizeCriteria(template.criteria));
    setIsActive(template.is_active);
    setError(null);
  }, [template]);

  const totalWeight = useMemo(
    () => criteria.reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0),
    [criteria],
  );
  const hasValidWeight = totalWeight === 100;

  const handleAddCriteria = () => {
    const nextOrder = criteria.length > 0 ? Math.max(...criteria.map((item) => Number(item.order) || 0)) + 1 : 1;
    setCriteria([
      ...criteria,
      {
        name: '',
        weight: 10,
        maxScore: 10,
        order: nextOrder,
      },
    ]);
  };

  const handleUpdateCriteria = (
    index: number,
    field: keyof EvaluationCriteria,
    value: string | number,
  ) => {
    setCriteria((current) =>
      current.map((criterion, currentIndex) => {
        if (currentIndex !== index) return criterion;

        if (field === 'name') {
          return { ...criterion, name: String(value) };
        }

        const numericValue = value === '' ? 0 : Number(value);
        const normalizedValue = Number.isFinite(numericValue)
          ? numericValue
          : 0;
        return {
          ...criterion,
          [field]:
            field === 'weight'
              ? Math.min(100, Math.max(0, normalizedValue))
              : field === 'maxScore' || field === 'order'
                ? Math.max(1, normalizedValue || 1)
                : normalizedValue,
        };
      }),
    );
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria((current) =>
      current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((criterion, currentIndex) => ({
          ...criterion,
          order: currentIndex + 1,
        })),
    );
  };

  const handleSave = async () => {
    if (!canWrite) return;
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!hasValidWeight) {
      setError('Criteria weights must sum to 100');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        isActive,
        criteria: normalizeCriteria(criteria),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight truncate">
              {template.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Interview evaluation criteria
            </p>
            {categoryLabel && (
              <p className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Category: {categoryLabel}
              </p>
            )}
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              hasValidWeight
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            Total Weight: {totalWeight}%
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canWrite || loading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        {criteria.map((criterion, index) => (
          <div
            key={`${criterion.order}-${index}`}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-sm shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Criteria Name
                  </label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) =>
                      handleUpdateCriteria(index, 'name', e.target.value)
                    }
                    disabled={!canWrite || loading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={criterion.weight}
                    onChange={(e) =>
                      handleUpdateCriteria(index, 'weight', e.target.value)
                    }
                    disabled={!canWrite || loading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={criterion.maxScore ?? 10}
                    onChange={(e) =>
                      handleUpdateCriteria(index, 'maxScore', e.target.value)
                    }
                    disabled={!canWrite || loading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={criterion.order}
                    onChange={(e) =>
                      handleUpdateCriteria(index, 'order', e.target.value)
                    }
                    disabled={!canWrite || loading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              {canWrite && criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCriteria(index)}
                  className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                  title="Remove criteria"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}

        {canWrite && (
          <button
            type="button"
            onClick={handleAddCriteria}
            className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all focus:outline-none cursor-pointer"
          >
            + Add Criteria
          </button>
        )}

        {canWrite && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-xs font-semibold text-slate-700">
                Active
              </span>
            </label>
          </div>
        )}
      </div>

      {canWrite && (
        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasValidWeight || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
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
        </div>
      )}
    </div>
  );
};

export default EvaluationTemplateDetail;
