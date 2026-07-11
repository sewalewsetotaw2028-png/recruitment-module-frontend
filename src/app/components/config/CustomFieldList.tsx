import React, { useMemo, useState } from 'react';
import type { CustomField } from '@/hooks/useCustomFields';
import {
  customFieldEntityLabel,
  customFieldTypeLabel,
} from '@/hooks/useCustomFields';

interface CustomFieldListProps {
  fields: CustomField[];
  selectedFieldId: string | null;
  loading: boolean;
  onSelect: (field: CustomField) => void;
  onAdd: () => void;
  onEdit: (field: CustomField) => void;
  onDelete: (field: CustomField) => void;
}

const ENTITY_ORDER = [
  'RecruitmentRequest',
  'Vacancy',
  'Candidate',
  'Application',
] as const;

const fieldBadgeClass = (entityType: string) => {
  switch (entityType) {
    case 'RecruitmentRequest':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
    case 'Vacancy':
      return 'bg-blue-50 text-blue-700 border-blue-200/60';
    case 'Candidate':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200/60';
  }
};

export const CustomFieldList: React.FC<CustomFieldListProps> = ({
  fields,
  selectedFieldId,
  loading,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFields = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return fields;
    return fields.filter((field) => {
      return (
        field.field_name.toLowerCase().includes(query) ||
        field.entity_type.toLowerCase().includes(query) ||
        field.field_type.toLowerCase().includes(query)
      );
    });
  }, [fields, searchQuery]);

  const groupedFields = useMemo(() => {
    const grouped = ENTITY_ORDER.map((entityType) => ({
      entityType,
      items: filteredFields.filter((field) => field.entity_type === entityType),
    })).filter((group) => group.items.length > 0);

    const knownTypes = new Set(ENTITY_ORDER);
    const extras = filteredFields.filter(
      (field) => !knownTypes.has(field.entity_type as (typeof ENTITY_ORDER)[number]),
    );

    if (extras.length > 0) {
      grouped.push({
        entityType: 'Other',
        items: extras,
      });
    }

    return grouped;
  }, [filteredFields]);

  return (
    <div className="flex h-full min-h-0 flex-col text-sm">
      <div className="shrink-0 select-none border-b border-slate-100 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold tracking-tight text-slate-800">
            Custom Fields
          </h3>
          <button
            id="add-field-btn"
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              add
            </span>
            New
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search fields..."
          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/30 p-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-xs animate-pulse"
            >
              <div className="h-3 w-2/3 rounded-md bg-slate-200" />
              <div className="mt-2 h-2.5 w-1/2 rounded-md bg-slate-100" />
            </div>
          ))
        ) : filteredFields.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-white px-5 py-12 text-center font-medium italic text-slate-400 shadow-xs">
            {searchQuery.trim()
              ? 'No custom fields match your search.'
              : 'No custom fields found.'}
          </div>
        ) : (
          groupedFields.map((group) => (
            <div key={group.entityType} className="space-y-2">
              <div className="px-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {customFieldEntityLabel(group.entityType)}
                </p>
              </div>

              <div className="space-y-2">
                {group.items.map((field) => {
                  const isSelected = field.id === selectedFieldId;
                  return (
                    <div
                      key={field.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(field)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelect(field);
                        }
                      }}
                      className={`group w-full rounded-xl border px-4 py-3 text-left transition-all overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-100 bg-white shadow-xs hover:border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate text-xs font-extrabold uppercase tracking-wide transition-colors ${
                                isSelected
                                  ? 'text-indigo-600'
                                  : 'text-slate-700 group-hover:text-indigo-600'
                              }`}
                            >
                              {field.field_name}
                            </span>
                            {field.is_required && (
                              <span className="inline-flex items-center rounded-md border border-red-200/40 bg-red-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-red-700 select-none">
                                Required
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider select-none ${fieldBadgeClass(
                                field.entity_type,
                              )}`}
                            >
                              {customFieldEntityLabel(field.entity_type)}
                            </span>
                          </div>

                          <p className="mt-0.5 block max-w-full truncate text-[11px] font-medium leading-relaxed text-slate-500">
                            {customFieldTypeLabel(field.field_type)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              id={`edit-field-${field.id}`}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onEdit(field);
                              }}
                              className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 focus:outline-none"
                              title="Edit field"
                            >
                              <span className="material-symbols-outlined block text-[15px]">
                                edit
                              </span>
                            </button>
                            <button
                              id={`delete-field-${field.id}`}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDelete(field);
                              }}
                              className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none"
                              title="Delete field"
                            >
                              <span className="material-symbols-outlined block text-[15px]">
                                delete
                              </span>
                            </button>
                          </div>

                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                            }`}
                          >
                            <span className="material-symbols-outlined block text-[15px]">
                              data_object
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomFieldList;
