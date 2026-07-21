import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createEmptyScreeningCriterion,
  SCREENING_CRITERIA_FIELDS,
  SCREENING_CRITERIA_OPERATOR_OPTIONS,
  SCREENING_CRITERIA_VALUE_PLACEHOLDERS,
  SCREENING_CRITERIA_VALUE_OPTIONS,
  COMMON_SKILLS,
  type ScreeningCriterion,
} from '@/hooks/useScreeningCriteria';

// ---------- Technical Skills searchable multi-select with free-add ----------
interface TechPickerProps {
  index: number;
  value: string[];
  onChange: (skills: string[]) => void;
  disabled: boolean;
}

const TechnicalSkillsPicker: React.FC<TechPickerProps> = ({ index, value, onChange, disabled }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...COMMON_SKILLS].slice(0, 40);
    return [...COMMON_SKILLS].filter((s) => s.toLowerCase().includes(q)).slice(0, 40);
  }, [search]);

  const notInList = search.trim() && !COMMON_SKILLS.some(
    (s) => s.toLowerCase() === search.trim().toLowerCase()
  );

  const toggle = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const already = value.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    onChange(already ? value.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()) : [...value, trimmed]);
  };

  const addCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    toggle(trimmed);
    setSearch('');
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-medium"
            >
              {skill}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(skill)}
                  className="hover:text-indigo-900"
                >
                  <span className="material-symbols-outlined text-[11px]">close</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type a skill..."
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        {open && !disabled && (
          <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
            <div className="p-1.5 space-y-0.5">
              {notInList && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addCustom(); setOpen(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                >
                  + Add "{search.trim()}"
                </button>
              )}
              {filtered.map((skill) => {
                const selected = value.some((s) => s.toLowerCase() === skill.toLowerCase());
                return (
                  <button
                    key={skill}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); toggle(skill); }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between ${
                      selected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {skill}
                    {selected && <span className="material-symbols-outlined text-[13px]">check</span>}
                  </button>
                );
              })}
              {filtered.length === 0 && !notInList && (
                <p className="px-2 py-1.5 text-xs text-slate-400 italic">No skills found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ScreeningCriteriaDetailProps {
  scopeLabel: string;
  scopeDescription: string;
  overrideNote?: string;
  criteria: ScreeningCriterion[];
  isActive: boolean;
  loading: boolean;
  canWrite: boolean;
  onSave: (payload: {
    criteriaJson: ScreeningCriterion[];
    isActive: boolean;
  }) => Promise<void>;
}

const getOperatorOptions = (field: string) =>
  SCREENING_CRITERIA_OPERATOR_OPTIONS[
    field as keyof typeof SCREENING_CRITERIA_OPERATOR_OPTIONS
  ] ?? ['required'];

export const ScreeningCriteriaDetail: React.FC<
  ScreeningCriteriaDetailProps
> = ({
  scopeLabel,
  scopeDescription,
  overrideNote,
  criteria,
  isActive,
  loading,
  canWrite,
  onSave,
}) => {
  const [criteriaJson, setCriteriaJson] = useState<ScreeningCriterion[]>(
    criteria.length > 0 ? criteria : [createEmptyScreeningCriterion()],
  );
  const [active, setActive] = useState(isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCriteriaJson(
      criteria.length > 0 ? criteria : [createEmptyScreeningCriterion()],
    );
    setActive(isActive);
    setError(null);
  }, [criteria, isActive]);

  const weightTotal = useMemo(
    () => criteriaJson.reduce((sum, rule) => sum + Number(rule.weight || 0), 0),
    [criteriaJson],
  );
  const hasValidWeightTotal = weightTotal === 100;
  const hasRules = criteriaJson.length > 0;

  const updateRule = (
    index: number,
    field: 'field' | 'operator' | 'value' | 'weight',
    value: string | number | string[],
  ) => {
    setCriteriaJson((current) => {
      const updated = [...current];
      const existing = updated[index];
      if (!existing) return current;

      if (field === 'field') {
        const nextField = String(value);
        const nextOperator = getOperatorOptions(nextField)[0] ?? 'required';
        updated[index] = {
          ...existing,
          field: nextField,
          operator: nextOperator,
        };
      } else if (field === 'operator') {
        updated[index] = {
          ...existing,
          operator: String(value),
        };
      } else if (field === 'value') {
        updated[index] = {
          ...existing,
          value: value,
        };
      } else {
        updated[index] = {
          ...existing,
          weight: Number(value) || 0,
        };
      }

      return updated;
    });
  };

  const handleAddRule = () => {
    setCriteriaJson((current) => [...current, createEmptyScreeningCriterion()]);
  };

  const handleRemoveRule = (index: number) => {
    setCriteriaJson((current) => {
      if (current.length <= 1) {
        return [createEmptyScreeningCriterion()];
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!canWrite || saving) return;
    setSaving(true);
    setError(null);

    if (!hasRules) {
      setError('Add at least one screening criterion before saving.');
      setSaving(false);
      return;
    }

    if (!hasValidWeightTotal) {
      setError('The total weight must equal 100 before you save.');
      setSaving(false);
      return;
    }

    try {
      await onSave({
        criteriaJson,
        isActive: active,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save criteria');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
          <div className="h-4 w-44 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-72 mt-3 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((__, innerIndex) => (
                  <div key={innerIndex} className="h-10 rounded bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-4 shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                Configuration
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {scopeLabel}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Screening Criteria
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
              {scopeDescription}
            </p>
            {overrideNote && (
              <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 inline-flex">
                {overrideNote}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={!canWrite}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed"
                />
                Active
              </label>
              <span
                className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-extrabold border ${
                  hasValidWeightTotal
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : 'bg-rose-50 text-rose-700 border-rose-200/60'
                }`}
              >
                Weight total {weightTotal} / 100
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canWrite || saving || !hasValidWeightTotal || !hasRules}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
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
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {criteriaJson.map((rule, index) => (
          <div
            key={`${rule.field}-${index}`}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-sm shrink-0">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Field
                  </label>
                  <select
                    value={rule.field}
                    onChange={(e) =>
                      updateRule(index, 'field', e.target.value)
                    }
                    disabled={!canWrite}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {SCREENING_CRITERIA_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Operator
                  </label>
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(index, 'operator', e.target.value)
                    }
                    disabled={!canWrite}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {getOperatorOptions(rule.field).map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Value
                  </label>
                  {String(rule.operator) === 'min_years' || String(rule.operator) === 'max_salary' ? (
                    <input
                      type="number"
                      min="0"
                      step={String(rule.operator) === 'max_salary' ? '1000' : '1'}
                      value={rule.value ?? ''}
                      onChange={(e) =>
                        updateRule(index, 'value', Number(e.target.value) || 0)
                      }
                      placeholder={SCREENING_CRITERIA_VALUE_PLACEHOLDERS[
                        rule.field as keyof typeof SCREENING_CRITERIA_VALUE_PLACEHOLDERS
                      ] ?? 'Enter a value'}
                      disabled={!canWrite}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  ) : rule.field === 'Technical Skills' ? (
                    <TechnicalSkillsPicker
                      index={index}
                      value={Array.isArray(rule.value) ? rule.value : (rule.value ? String(rule.value).split(',').map((s: string) => s.trim()).filter(Boolean) : [])}
                      onChange={(skills) => updateRule(index, 'value', skills)}
                      disabled={!canWrite}
                    />
                  ) : rule.field === 'Language Proficiency' ? (
                    <input
                      type="text"
                      value={Array.isArray(rule.value) ? rule.value.join(', ') : (rule.value ?? '')}
                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                      placeholder="e.g. English, Amharic"
                      disabled={!canWrite}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  ) : SCREENING_CRITERIA_VALUE_OPTIONS[rule.field as keyof typeof SCREENING_CRITERIA_VALUE_OPTIONS] ? (
                    <select
                      value={rule.value ?? ''}
                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                      disabled={!canWrite}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Select value</option>
                      {SCREENING_CRITERIA_VALUE_OPTIONS[rule.field as keyof typeof SCREENING_CRITERIA_VALUE_OPTIONS]?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={rule.value ?? ''}
                      onChange={(e) =>
                        updateRule(index, 'value', e.target.value)
                      }
                      placeholder={SCREENING_CRITERIA_VALUE_PLACEHOLDERS[
                        rule.field as keyof typeof SCREENING_CRITERIA_VALUE_PLACEHOLDERS
                      ] ?? 'Enter a value'}
                      disabled={!canWrite}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rule.weight}
                    onChange={(e) =>
                      updateRule(index, 'weight', Number(e.target.value) || 0)
                    }
                    disabled={!canWrite}
                    className={`w-full px-3 py-2 rounded-lg border bg-white text-xs font-semibold focus:outline-none focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                      hasValidWeightTotal
                        ? 'border-slate-200 text-slate-800 focus:ring-indigo-600/20 focus:border-indigo-600'
                        : 'border-rose-300 text-rose-700 focus:ring-rose-600/20 focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              {canWrite && (
                <button
                  type="button"
                  onClick={() => handleRemoveRule(index)}
                  className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                  title="Remove rule"
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
            onClick={handleAddRule}
            className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all focus:outline-none cursor-pointer"
          >
            + Add Criterion
          </button>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-1">Notes</p>
          <ul className="space-y-1">
            <li>Field and operator options follow the backend validation rules.</li>
            <li>The total weight must always equal 100 before saving.</li>
            <li>
              Vacancy-specific criteria override the template profile when an
              override exists.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScreeningCriteriaDetail;
