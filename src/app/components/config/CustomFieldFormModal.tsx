import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  CUSTOM_FIELD_ENTITY_TYPES,
  CUSTOM_FIELD_TYPES,
  customFieldEntityLabel,
  normalizeCustomFieldType,
} from '@/hooks/useCustomFields';
import type {
  CustomField,
  CreateCustomFieldPayload,
  UpdateCustomFieldPayload,
  CustomFieldEntityType,
  CustomFieldType,
} from '@/hooks/useCustomFields';

interface CustomFieldFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  field?: CustomField | null;
  onSubmit: (
    payload: CreateCustomFieldPayload | UpdateCustomFieldPayload,
  ) => Promise<void>;
}

export const CustomFieldFormModal: React.FC<CustomFieldFormModalProps> = ({
  isOpen,
  onClose,
  field,
  onSubmit,
}) => {
  const isEditMode = !!field;

  const [entityType, setEntityType] = useState<CustomFieldEntityType | ''>('');
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportsOptions = useMemo(
    () => fieldType === 'select',
    [fieldType],
  );

  useEffect(() => {
    if (isOpen) {
      setEntityType((field?.entity_type as CustomFieldEntityType | undefined) ?? '');
      setFieldName(field?.field_name ?? '');
      setFieldType(normalizeCustomFieldType(field?.field_type ?? 'text'));
      setIsRequired(field?.is_required ?? false);
      setOptions(field?.options ?? '');
      setError(null);
    }
  }, [isOpen, field]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!entityType || !fieldName.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: UpdateCustomFieldPayload = {
          fieldName: fieldName.trim(),
          fieldType,
          isRequired,
          options: supportsOptions ? options.trim() || undefined : undefined,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateCustomFieldPayload = {
          entityType,
          fieldName: fieldName.trim(),
          fieldType,
          isRequired,
          options: supportsOptions ? options.trim() || undefined : undefined,
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
      title={isEditMode ? 'Edit Custom Field' : 'Add New Custom Field'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {!isEditMode ? (
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Entity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={entityType}
              onChange={(event) =>
                setEntityType(event.target.value as CustomFieldEntityType)
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-xs transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">Select entity type</option>
              {CUSTOM_FIELD_ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {customFieldEntityLabel(type)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Entity Type
            </label>
            <input
              type="text"
              value={customFieldEntityLabel(field?.entity_type ?? entityType)}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-400"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
            Field Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={(event) => setFieldName(event.target.value)}
            placeholder="e.g. LinkedIn Profile"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
            Field Type <span className="text-red-500">*</span>
          </label>
          <select
            value={fieldType}
            onChange={(event) =>
              setFieldType(event.target.value as CustomFieldType)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-xs transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
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
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Options
            </label>
            <textarea
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              rows={3}
              placeholder="Comma-separated values, e.g. Remote, Hybrid, On-site"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-slate-800 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="text-xs font-semibold text-slate-700">
              Required Field
            </span>
          </label>
        </div>

        {error && (
          <div className="animate-fade-in rounded-xl border border-red-200/60 bg-red-50/60 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-red-500">
                error
              </span>
              <p className="text-xs font-semibold leading-relaxed text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="custom-field-form-submit"
            type="submit"
            disabled={submitting || !fieldName.trim() || !entityType}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm leading-none">
                  progress_activity
                </span>
                Saving...
              </>
            ) : isEditMode ? (
              'Update Field'
            ) : (
              'Create Field'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomFieldFormModal;
