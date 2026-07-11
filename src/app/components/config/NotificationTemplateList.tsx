import React from 'react';
import type { NotificationTemplate } from '@/hooks/useNotificationTemplates';

interface NotificationTemplateListProps {
  templates: NotificationTemplate[];
  selectedTemplateId: string | null;
  loading: boolean;
  onSelect: (template: NotificationTemplate) => void;
}

export const NotificationTemplateList: React.FC<
  NotificationTemplateListProps
> = ({ templates, selectedTemplateId, loading, onSelect }) => {
  return (
    <div className="flex flex-col h-full min-h-0 text-sm">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white select-none shrink-0">
        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
          Templates
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3.5 bg-white border border-slate-100 rounded-xl animate-pulse"
            >
              <div className="h-3 bg-slate-200 rounded-md w-2/3" />
              <div className="h-2.5 bg-slate-100 rounded-md w-1/2 mt-2" />
            </div>
          ))
        ) : templates.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 font-medium italic bg-white border border-slate-100 rounded-xl shadow-xs">
            No templates found.
          </div>
        ) : (
          templates.map((template) => {
            const isSelected = template.id === selectedTemplateId;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className={`w-full text-left px-4 py-3 transition-all cursor-pointer focus:outline-none rounded-xl border ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wide truncate transition-colors ${
                      isSelected
                        ? 'text-indigo-600'
                        : 'text-slate-700 hover:text-indigo-600'
                    }`}
                  >
                    {template.type}
                  </span>
                  {template.is_active && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200/40 uppercase tracking-wider select-none">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate leading-relaxed">
                  {template.subject}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationTemplateList;
