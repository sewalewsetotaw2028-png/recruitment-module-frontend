import React, { useMemo, useState } from 'react';
import type { ApprovalWorkflow } from '@/hooks/useApprovalWorkflows';

interface ApprovalWorkflowListProps {
  workflows: ApprovalWorkflow[];
  selectedWorkflowId: string | null;
  loading: boolean;
  onSelect: (workflow: ApprovalWorkflow) => void;
  onAdd: () => void;
  onEdit: (workflow: ApprovalWorkflow) => void;
  canWrite: boolean;
}

export const ApprovalWorkflowList: React.FC<ApprovalWorkflowListProps> = ({
  workflows,
  selectedWorkflowId,
  loading,
  onSelect,
  onAdd,
  onEdit,
  canWrite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [workflows, selectedWorkflowId],
  );

  const filteredWorkflows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return workflows;

    return workflows.filter((workflow) => {
      return (
        workflow.name.toLowerCase().includes(query) ||
        workflow.entity_type.toLowerCase().includes(query) ||
        (workflow.stages.length ? String(workflow.stages.length) : '').includes(query)
      );
    });
  }, [searchQuery, workflows]);

  return (
    <div className="flex flex-col h-full min-h-0 text-sm">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white select-none shrink-0 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Workflows
          </h3>
          <button
            id="add-workflow-btn"
            onClick={onAdd}
            disabled={!canWrite}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              add
            </span>
            New Workflow
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              Currently editing
            </p>
            {selectedWorkflow ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider truncate max-w-[140px]">
                {selectedWorkflow.name}
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
            placeholder="Search workflows..."
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded-md w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded-md w-1/2" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
          ))
        ) : filteredWorkflows.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 font-medium italic bg-white border border-slate-100 rounded-xl shadow-xs">
            {searchQuery.trim()
              ? 'No workflows match your search.'
              : 'No workflows found.'}
          </div>
        ) : (
          filteredWorkflows.map((workflow) => {
            const isSelected = workflow.id === selectedWorkflowId;
            return (
              <button
                key={workflow.id}
                id={`workflow-item-${workflow.id}`}
                onClick={() => onSelect(workflow)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all cursor-pointer group focus:outline-none rounded-xl border ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wide truncate transition-colors ${
                        isSelected
                          ? 'text-indigo-600'
                          : 'text-slate-700 group-hover:text-indigo-600'
                      }`}
                    >
                      {workflow.name}
                    </span>
                    {workflow.is_active && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200/40 uppercase tracking-wider select-none">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate leading-relaxed">
                    {workflow.entity_type}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[12px] text-slate-400 leading-none">
                      steps
                    </span>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {workflow.stages.length} stages
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`edit-workflow-${workflow.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(workflow);
                      }}
                      className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                      title="Edit workflow"
                    >
                      <span className="material-symbols-outlined text-[15px] block">
                        edit
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
                      account_tree
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ApprovalWorkflowList;
