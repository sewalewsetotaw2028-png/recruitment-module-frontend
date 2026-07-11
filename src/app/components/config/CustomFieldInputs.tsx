import React, { useEffect, useMemo, useState } from 'react';
import { fetchCustomFields } from '@/hooks/useCustomFields';
import type {
  CustomField,
  CustomFieldEntityType,
} from '@/hooks/useCustomFields';
import {
  customFieldEntityLabel,
  customFieldTypeLabel,
  normalizeCustomFieldType,
} from '@/hooks/useCustomFields';

interface CustomFieldInputsProps {
  entityType: CustomFieldEntityType;
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

const parseOptions = (field: CustomField) => {
  const raw = field.options?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const CustomFieldInputs: React.FC<CustomFieldInputsProps> = ({
  entityType,
  values,
  onChange,
}) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const allFields = await fetchCustomFields();
        if (!alive) return;
        setFields(
          allFields.filter((field) => field.entity_type === entityType),
        );
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, [entityType]);

  const hasFields = useMemo(() => fields.length > 0, [fields]);

  if (loading) {
    return (
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (!hasFields) return null;

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Custom Fields
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">
          {customFieldEntityLabel(entityType)} inputs
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          These fields come from the live configuration and update automatically
          when an admin adds or changes a field.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const type = normalizeCustomFieldType(field.field_type);
          const currentValue = values[field.id] ?? '';
          const optionList = parseOptions(field);

          return (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                {field.field_name}
                {field.is_required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>

              {type === 'boolean' ? (
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={currentValue === 'true'}
                    onChange={(event) =>
                      onChange(field.id, String(event.target.checked))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {customFieldTypeLabel(field.field_type)}
                  </span>
                </label>
              ) : type === 'select' && optionList.length > 0 ? (
                <select
                  value={currentValue}
                  onChange={(event) => onChange(field.id, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="">Select {field.field_name}</option>
                  {optionList.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                  value={currentValue}
                  onChange={(event) => onChange(field.id, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  placeholder={`Enter ${field.field_name.toLowerCase()}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CustomFieldInputs;
