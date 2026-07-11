import React, { useEffect, useMemo, useState } from 'react';
import {
  CUSTOM_FIELD_TYPES,
  customFieldEntityLabel,
  customFieldTypeLabel,
  normalizeCustomFieldType,
} from '@/hooks/useCustomFields';
import type { CustomField, CustomFieldType } from '@/hooks/useCustomFields';

interface CustomFieldDetailProps {
  field: CustomField;
  loading: boolean;
  onSave: (payload: any) => Promise<void>;
  canWrite: boolean;
}

export const CustomFieldDetail: React.FC<CustomFieldDetailProps> = ({
  field,
  loading,
  onSave,
  canWrite,
}) => {
  const [fieldName, setFieldName] = useState(field.field_name);
  const [fieldType, setFieldType] = useState<CustomFieldType>(
    normalizeCustomFieldType(field.field_type),
  );
  const [isRequired, setIsRequired] = useState(field.is_required);
  const [options, setOptions] = useState(field.options || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportsOptions = useMemo(() => fieldType === 'select', [fieldType]);

  useEffect(() => {
    setFieldName(field.field_name);
    setFieldType(normalizeCustomFieldType(field.field_type));
    setIsRequired(field.is_required);
    setOptions(field.options || '');
  }, [field]);

  const handleSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        fieldName,
        fieldType,
        isRequired,
        options: supportsOptions ? options.trim() || undefined : undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              {customFieldEntityLabel(field.entity_type)}
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-800">
              {field.field_name}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {customFieldTypeLabel(field.field_type)}
            </p>
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm leading-none">
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
        <div className="mx-6 mt-4 rounded-xl border border-red-200/60 bg-red-50/60 p-3.5 text-xs text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
            Field Name
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={(event) => setFieldName(event.target.value)}
            disabled={!canWrite}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
            Entity Type
          </label>
          <input
            type="text"
            value={customFieldEntityLabel(field.entity_type)}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
            Field Type
          </label>
          <select
            value={fieldType}
            onChange={(event) =>
              setFieldType(event.target.value as CustomFieldType)
            }
            disabled={!canWrite}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            {CUSTOM_FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'select'
                  ? 'Select'
                  : type === 'boolean'
                    ? 'Boolean'
                    : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {supportsOptions && (
          <div>
            <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
              Options
            </label>
            <textarea
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              disabled={!canWrite}
              rows={4}
              placeholder="Comma-separated values"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-slate-800 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
              disabled={!canWrite}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed"
            />
            <span className="text-xs font-semibold text-slate-700">
              Required Field
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CustomFieldDetail;
