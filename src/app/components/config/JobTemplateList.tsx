import React, { useMemo, useState } from 'react';
import type { JobTemplate } from '@/hooks/useJobTemplates';

interface JobTemplateListProps {
  templates: JobTemplate[];
  selectedTemplateId: string | null;
  loading: boolean;
  onSelect: (template: JobTemplate) => void;
  onAdd: () => void;
  onEdit: (template: JobTemplate) => void;
  onDelete: (template: JobTemplate) => void;
}

export const JobTemplateList: React.FC<JobTemplateListProps> = ({
  templates,
  selectedTemplateId,
  loading,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return templates;

    // Keep filtering local so long template lists stay scannable without
    // pushing the selected template context off-screen.
    return templates.filter((template) => {
      return (
        template.title.toLowerCase().includes(query) ||
        template.employment_type.toLowerCase().includes(query) ||
        (template.job_grade ?? '').toLowerCase().includes(query)
      );
    });
  }, [searchQuery, templates]);

  return (
    <div className="flex flex-col h-full min-h-0 text-sm">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white select-none shrink-0 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Templates
          </h3>
          <button
            id="add-template-btn"
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm focus:outline-none cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              add
            </span>
            New
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              Currently editing
            </p>
            {selectedTemplate ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider truncate max-w-[140px]">
                {selectedTemplate.title}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-50 text-slate-400 border border-slate-200 uppercase tracking-wider">
                None
              </span>
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 bg-white border border-slate-100 rounded-xl animate-pulse">
              <div className="h-3 bg-slate-200 rounded-md w-2/3" />
              <div className="h-2.5 bg-slate-100 rounded-md w-1/2 mt-2" />
            </div>
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 font-medium italic bg-white border border-slate-100 rounded-xl shadow-xs">
            {searchQuery.trim() ? 'No templates match your search.' : 'No templates found.'}
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = template.id === selectedTemplateId;
            return (
              <div
                key={template.id}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all cursor-pointer group focus:outline-none rounded-xl border ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(template)}
                  className="flex-1 text-left focus:outline-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-extrabold uppercase tracking-wide truncate transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                        {template.title}
                      </span>
                      {template.is_active && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200/40 uppercase tracking-wider select-none">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate leading-relaxed">
                      {template.employment_type}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[12px] text-slate-400 leading-none">
                        description
                      </span>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {template.job_descriptions.length} versions
                      </p>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      id={`edit-template-${template.id}`}
                      onClick={() => onEdit(template)}
                      className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                      title="Edit template"
                    >
                      <span className="material-symbols-outlined text-[15px] block">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      id={`delete-template-${template.id}`}
                      onClick={() => onDelete(template)}
                      className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                      title="Delete template"
                    >
                      <span className="material-symbols-outlined text-[15px] block">
                        delete
                      </span>
                    </button>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] block">
                      work
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JobTemplateList;
