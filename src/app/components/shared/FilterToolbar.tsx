import React from 'react';

export interface FilterField {
  key: string;
  label: string;
  type?: 'search' | 'select' | 'number';
  placeholder?: string;
  value: string;
  options?: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

interface FilterToolbarProps {
  fields: FilterField[];
  onClear?: () => void;
  resultCount?: number;
  resultLabel?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  fields,
  onClear,
  resultCount,
  resultLabel = 'results',
}) => (
  <section className="filter-toolbar">
    <div className="filter-toolbar-grid">
      {fields.map((f) => (
        <div
          key={f.key}
          className={
            f.className ||
            (f.type === 'search' ? 'sm:col-span-2 lg:col-span-2' : '')
          }
        >
          <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
            {f.label}
          </label>
          {f.type === 'select' ? (
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="input-field text-sm"
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === 'number' ? 'number' : 'search'}
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="input-field text-sm"
            />
          )}
        </div>
      ))}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant">
      {resultCount != null && (
        <span>
          <strong className="text-primary">{resultCount}</strong> {resultLabel}
        </span>
      )}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 text-sm font-bold text-primary hover:bg-surface-container-low"
        >
          Clear all filters
        </button>
      )}
    </div>
  </section>
);
