import React, { useEffect, useMemo, useState } from 'react';
import type {
  ApprovalWorkflow,
  UpdateApprovalWorkflowStagesPayload,
} from '@/hooks/useApprovalWorkflows';
import type { AppRole } from '@/hooks/useRolesConfig';

interface ApprovalWorkflowDetailProps {
  workflow: ApprovalWorkflow;
  loading: boolean;
  roles: AppRole[];
  rolesLoading: boolean;
  onSave: (isActive: boolean) => Promise<void>;
  onSaveStages: (
    stages: UpdateApprovalWorkflowStagesPayload['stages'],
  ) => Promise<void>;
  onDelete: () => void;
  canWrite: boolean;
  onUnsavedCheck: (hasUnsaved: boolean) => void;
}

const getStageSignature = (
  stages: ApprovalWorkflow['stages'],
): string =>
  JSON.stringify(
    stages.map((stage) => ({
      id: stage.id,
      stage_order: stage.stage_order,
      stage_name: stage.stage_name,
      approver_role_id: stage.approver_role_id,
      is_mandatory: stage.is_mandatory,
    })),
  );

export const ApprovalWorkflowDetail: React.FC<
  ApprovalWorkflowDetailProps
> = ({
  workflow,
  loading,
  roles,
  rolesLoading,
  onSave,
  onSaveStages,
  onDelete,
  canWrite,
  onUnsavedCheck,
}) => {
  const [isActive, setIsActive] = useState(workflow.is_active);
  const [stages, setStages] = useState(workflow.stages);
  const [baselineStages, setBaselineStages] = useState(workflow.stages);
  const [saving, setSaving] = useState(false);
  const [savingStages, setSavingStages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalSignature = useMemo(
    () => getStageSignature(baselineStages),
    [baselineStages],
  );
  const currentSignature = useMemo(() => getStageSignature(stages), [stages]);
  const hasUnsavedStages = currentSignature !== originalSignature;

  // Keep local editable state in sync when the selected workflow changes.
  useEffect(() => {
    setIsActive(workflow.is_active);
    setStages(workflow.stages);
    setBaselineStages(workflow.stages);
    setError(null);
    onUnsavedCheck(false);
  }, [workflow.id, workflow.is_active, workflow.stages, onUnsavedCheck]);

  useEffect(() => {
    onUnsavedCheck(hasUnsavedStages);
  }, [hasUnsavedStages, onUnsavedCheck]);

  const roleNameById = useMemo(() => {
    const m = new Map<string, string>();
    roles.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [roles]);

  const handleToggleActive = async () => {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(!isActive);
      setIsActive(!isActive);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStage = () => {
    const newStage = {
      id: `temp-${Date.now()}`,
      workflow_id: workflow.id,
      stage_order: stages.length,
      stage_name: `Stage ${stages.length + 1}`,
      approver_role_id: null,
      is_mandatory: true,
      created_at: new Date().toISOString(),
    };
    setStages([...stages, newStage]);
    onUnsavedCheck(true);
  };

  const handleUpdateStage = (
    index: number,
    field: 'stage_name' | 'is_mandatory' | 'approver_role_id',
    value: string | boolean | null,
  ) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
    onUnsavedCheck(true);
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    updated.forEach((s, i) => {
      s.stage_order = i;
    });
    setStages(updated);
    onUnsavedCheck(true);
  };

  const handleRemoveStage = (index: number) => {
    const updated = stages.filter((_, i) => i !== index);
    updated.forEach((stage, i) => {
      stage.stage_order = i;
    });
    setStages(updated);
    onUnsavedCheck(true);
  };

  const handleRevert = () => {
    setStages(baselineStages);
    setError(null);
    onUnsavedCheck(false);
  };

  const handleSaveStages = async () => {
    if (!canWrite) return;
    setSavingStages(true);
    setError(null);
    try {
      const ordered = [...stages]
        .sort((a, b) => a.stage_order - b.stage_order)
        .map((s, i) => ({ ...s, stage_order: i }));
      setStages(ordered);

      await onSaveStages(
        ordered.map((s) => ({
          stageOrder: s.stage_order,
          stageName: s.stage_name,
          approverRoleId: s.approver_role_id ?? undefined,
          isMandatory: s.is_mandatory,
        })),
      );
      setBaselineStages(ordered);
      onUnsavedCheck(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save stages');
    } finally {
      setSavingStages(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {workflow.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <p className="text-xs text-slate-500 font-medium">
                  {workflow.entity_type}
                </p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider select-none">
                  {stages.length} stages
                </span>
                {hasUnsavedStages && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider select-none">
                    <span className="material-symbols-outlined text-[14px] leading-none">
                      warning
                    </span>
                    Unsaved stage changes
                  </span>
                )}
              </div>
            </div>

            {canWrite && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs focus:outline-none cursor-pointer border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    delete
                  </span>
                  Delete
                </button>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs focus:outline-none cursor-pointer ${
                    isActive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin leading-none">
                        progress_activity
                      </span>
                      Saving...
                    </>
                  ) : isActive ? (
                    'Active'
                  ) : (
                    'Inactive'
                  )}
                </button>
              </div>
            )}
          </div>

          {canWrite && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRevert}
                  disabled={!hasUnsavedStages || savingStages}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-extrabold text-slate-600 rounded-lg transition-all shadow-xs focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] leading-none">
                    undo
                  </span>
                  Revert
                </button>
                <button
                  type="button"
                  onClick={handleSaveStages}
                  disabled={!hasUnsavedStages || savingStages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-extrabold text-white rounded-lg transition-all shadow-sm shrink-0 focus:outline-none cursor-pointer"
                >
                  {savingStages ? (
                    <>
                      <span className="material-symbols-outlined text-[14px] animate-spin leading-none">
                        progress_activity
                      </span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px] leading-none">
                        save
                      </span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">
                Save here stays pinned while the stage list scrolls.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="h-4 w-32 bg-slate-200 rounded-md" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                        Stage Name
                      </label>
                      <input
                        type="text"
                        value={stage.stage_name}
                        onChange={(e) =>
                          handleUpdateStage(index, 'stage_name', e.target.value)
                        }
                        disabled={!canWrite}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                        Approver Role (optional)
                      </label>
                      <select
                        value={stage.approver_role_id ?? ''}
                        disabled={!canWrite || rolesLoading}
                        onChange={(e) =>
                          handleUpdateStage(
                            index,
                            'approver_role_id',
                            e.target.value ? e.target.value : null,
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {rolesLoading ? 'Loading roles...' : 'Any role'}
                        </option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {stage.approver_role_id &&
                        roleNameById.has(stage.approver_role_id) && (
                          <p className="mt-1 text-[11px] text-slate-400 font-semibold">
                            Only users with role:{' '}
                            {roleNameById.get(stage.approver_role_id)}
                          </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stage.is_mandatory}
                          onChange={(e) =>
                            handleUpdateStage(
                              index,
                              'is_mandatory',
                              e.target.checked,
                            )
                          }
                          disabled={!canWrite}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Mandatory
                        </span>
                      </label>
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveStage(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none cursor-pointer"
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
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none cursor-pointer"
                        title="Move down"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_downward
                        </span>
                      </button>
                      {stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(index)}
                          className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                          title="Remove stage"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {canWrite && (
              <button
                type="button"
                onClick={handleAddStage}
                className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all focus:outline-none cursor-pointer"
              >
                + Add Stage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalWorkflowDetail;
