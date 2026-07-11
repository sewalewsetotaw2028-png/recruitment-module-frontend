import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  ApprovalWorkflow,
  CreateApprovalWorkflowPayload,
  UpdateApprovalWorkflowPayload,
} from '@/hooks/useApprovalWorkflows';
import type { AppRole } from '@/hooks/useRolesConfig';

interface ApprovalWorkflowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow?: ApprovalWorkflow | null;
  roles: AppRole[];
  rolesLoading: boolean;
  onSubmit: (
    payload: CreateApprovalWorkflowPayload | UpdateApprovalWorkflowPayload,
  ) => Promise<void>;
}

export const ApprovalWorkflowFormModal: React.FC<
  ApprovalWorkflowFormModalProps
> = ({ isOpen, onClose, workflow, roles, rolesLoading, onSubmit }) => {
  const isEditMode = !!workflow;

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<
    'WorkforcePlan' | 'RecruitmentRequest' | 'HiringMinute'
  >('RecruitmentRequest');
  const [stages, setStages] = useState<
    { stageName: string; approverRoleId?: string; isMandatory: boolean }[]
  >([{ stageName: 'Initial Review', isMandatory: true }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(workflow?.name ?? '');
      setEntityType(workflow?.entity_type ?? 'RecruitmentRequest');
      setStages([{ stageName: 'Initial Review', isMandatory: true }]);
      setError(null);
    }
  }, [isOpen, workflow]);

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      { stageName: `Stage ${prev.length + 1}`, isMandatory: true },
    ]);
  };

  const removeStage = (index: number) => {
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setStages(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: UpdateApprovalWorkflowPayload = {
          name: name.trim(),
        };
        await onSubmit(payload);
      } else {
        const trimmedStages = stages
          .map((s) => ({
            stageName: s.stageName.trim(),
            approverRoleId: s.approverRoleId,
            isMandatory: s.isMandatory,
          }))
          .filter((s) => s.stageName.length > 0);

        if (trimmedStages.length === 0) {
          throw new Error('At least one stage is required');
        }

        const payload: CreateApprovalWorkflowPayload = {
          name: name.trim(),
          entityType,
          // Enforce unique stage orders by construction (index-based ordering).
          stages: trimmedStages.map((s, idx) => ({
            stageOrder: idx,
            stageName: s.stageName,
            approverRoleId: s.approverRoleId,
            isMandatory: s.isMandatory,
          })),
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
      title={isEditMode ? 'Edit Workflow' : 'Add New Workflow'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Name */}
        <div>
          <label
            htmlFor="workflow-name"
            className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5 select-none"
          >
            Workflow Name <span className="text-red-500">*</span>
          </label>
          <input
            id="workflow-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Recruitment Approval"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          />
        </div>

        {/* Entity Type */}
        {!isEditMode && (
          <div>
            <label
              htmlFor="entity-type"
              className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5 select-none"
            >
              Entity Type <span className="text-red-500">*</span>
            </label>
            <select
              id="entity-type"
              value={entityType}
              onChange={(e) =>
                setEntityType(
                  e.target.value as
                    | 'WorkforcePlan'
                    | 'RecruitmentRequest'
                    | 'HiringMinute',
                )
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
            >
              <option value="WorkforcePlan">Workforce Plan</option>
              <option value="RecruitmentRequest">Recruitment Request</option>
              <option value="HiringMinute">Hiring Minute</option>
            </select>
          </div>
        )}

        {/* Stages (create only) */}
        {!isEditMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide select-none">
                Stages
              </label>
              <button
                type="button"
                onClick={addStage}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-lg transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] leading-none">
                  add
                </span>
                Add Stage
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-3 bg-slate-50/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={stage.stageName}
                        onChange={(e) =>
                          setStages((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, stageName: e.target.value } : s,
                            ),
                          )
                        }
                        placeholder="Stage name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                            Approver Role (optional)
                          </label>
                          <select
                            value={stage.approverRoleId ?? ''}
                            disabled={rolesLoading}
                            onChange={(e) =>
                              setStages((prev) =>
                                prev.map((s, i) =>
                                  i === index
                                    ? {
                                        ...s,
                                        approverRoleId: e.target.value || undefined,
                                      }
                                    : s,
                                ),
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {rolesLoading ? 'Loading roles…' : 'Any role'}
                            </option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={stage.isMandatory}
                              onChange={(e) =>
                                setStages((prev) =>
                                  prev.map((s, i) =>
                                    i === index
                                      ? { ...s, isMandatory: e.target.checked }
                                      : s,
                                  ),
                                )
                              }
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              Mandatory
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveStage(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none cursor-pointer"
                        title="Move up"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_upward
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStage(index, 1)}
                        disabled={index === stages.length - 1}
                        className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none cursor-pointer"
                        title="Move down"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_downward
                        </span>
                      </button>
                      {stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                          title="Remove stage"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl animate-fade-in">
            <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">
              error
            </span>
            <p className="text-xs text-red-700 font-semibold leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="workflow-form-submit"
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin leading-none">
                  progress_activity
                </span>
                Saving…
              </>
            ) : isEditMode ? (
              'Update Workflow'
            ) : (
              'Create Workflow'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ApprovalWorkflowFormModal;
