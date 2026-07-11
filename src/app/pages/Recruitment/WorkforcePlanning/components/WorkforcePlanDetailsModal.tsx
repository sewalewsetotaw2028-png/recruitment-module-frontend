import React from 'react';
import type { WorkforcePlan } from '@/types';
import type { UserRole } from '@/state/appContext.types';

interface WorkforcePlanDetailsModalProps {
  plan: WorkforcePlan;
  onClose: () => void;
  onEdit?: (plan: WorkforcePlan) => void;
  onSubmit?: (planId: string) => void;
  onAction?: (
    planId: string,
    intent: 'forward' | 'return' | 'reject' | 'approve',
  ) => void;
  onDelete?: (planId: string) => void;
  canUpdatePlan?: boolean;
  canSubmitPlan?: boolean;
  canForwardPlan?: boolean;
  canApprovePlan?: boolean;
  canRejectPlan?: boolean;
  canReturnPlan?: boolean;
  canDeletePlan?: boolean;
}

export const WorkforcePlanDetailsModal: React.FC<
  WorkforcePlanDetailsModalProps
> = ({
  plan,
  onClose,
  onEdit,
  onSubmit,
  onAction,
  onDelete,
  canUpdatePlan = false,
  canSubmitPlan = false,
  canForwardPlan = false,
  canApprovePlan = false,
  canRejectPlan = false,
  canReturnPlan = false,
  canDeletePlan = false,
}) => {
  const canEdit =
    canUpdatePlan &&
    (plan.status === 'draft' ||
      plan.status === 'returned_for_revision' ||
      plan.status === 'rejected');

  const canDelete =
    canDeletePlan &&
    (plan.status === 'draft' ||
      plan.status === 'rejected' ||
      plan.status === 'returned_for_revision');

  return (
    <div className="fixed inset-0 z-99999 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-6 backdrop-blur-sm animate-fadeIn">
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                Workforce Plan Details
              </h3>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {plan.departmentName} - Version {plan.versionNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700 rounded-xl focus:outline-none"
              title="Dismiss view"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="mt-3 flex flex-wrap gap-3">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit?.(plan)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 focus:outline-none"
              >
                Edit plan
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(plan.id)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
              >
                Delete plan
              </button>
            )}
            {plan.status === 'draft' && canSubmitPlan && (
              <button
                type="button"
                onClick={() => onSubmit?.(plan.id)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
              >
                Submit plan
              </button>
            )}
            {/* Show individual action buttons directly based on permissions and status */}
            {plan.status === 'submitted' && canForwardPlan && onAction && (
              <button
                type="button"
                onClick={() => onAction(plan.id, 'forward')}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-violet-700"
              >
                Forward to CEO
              </button>
            )}
            {plan.status === 'submitted' && canReturnPlan && onAction && (
              <button
                type="button"
                onClick={() => onAction(plan.id, 'return')}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100"
              >
                Return for revision
              </button>
            )}
            {plan.status === 'submitted' && canRejectPlan && onAction && (
              <button
                type="button"
                onClick={() => onAction(plan.id, 'reject')}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
              >
                Reject
              </button>
            )}
            {plan.status === 'under_hr_review' &&
              canForwardPlan &&
              onAction && (
                <button
                  type="button"
                  onClick={() => onAction(plan.id, 'forward')}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-violet-700"
                >
                  Forward to CEO
                </button>
              )}
            {plan.status === 'under_hr_review' && canReturnPlan && onAction && (
              <button
                type="button"
                onClick={() => onAction(plan.id, 'return')}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100"
              >
                Return for revision
              </button>
            )}
            {plan.status === 'under_hr_review' && canRejectPlan && onAction && (
              <button
                type="button"
                onClick={() => onAction(plan.id, 'reject')}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
              >
                Reject
              </button>
            )}
            {(plan.status === 'under_ceo_review' ||
              plan.status === 'pending_ceo') &&
              canApprovePlan &&
              onAction && (
                <button
                  type="button"
                  onClick={() => onAction(plan.id, 'approve')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                >
                  Approve
                </button>
              )}
            {(plan.status === 'under_ceo_review' ||
              plan.status === 'pending_ceo') &&
              canReturnPlan &&
              onAction && (
                <button
                  type="button"
                  onClick={() => onAction(plan.id, 'return')}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100"
                >
                  Return for revision
                </button>
              )}
            {(plan.status === 'under_ceo_review' ||
              plan.status === 'pending_ceo') &&
              canRejectPlan &&
              onAction && (
                <button
                  type="button"
                  onClick={() => onAction(plan.id, 'reject')}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                >
                  Reject
                </button>
              )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Title / Designation
                </span>
                <p className="font-semibold text-slate-900">{plan.title}</p>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Department
                </span>
                <p className="font-medium text-slate-800">
                  {plan.departmentName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Planning Horizon & Cadence
                </span>
                <p className="font-medium text-slate-800">
                  {plan.planningPeriod}{' '}
                  <span className="font-normal text-slate-400">
                    ({plan.planningType})
                  </span>
                  {plan.quarter && (
                    <span className="font-normal text-slate-400">
                      {' '}
                      - {plan.quarter}
                    </span>
                  )}
                </p>
              </div>

              {plan.businessUnit && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Business Unit
                  </span>
                  <p className="font-medium text-slate-800">
                    {plan.businessUnit}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Planning Period
                </span>
                <p className="font-medium text-slate-800">
                  {plan.startDate} to {plan.endDate}
                </p>
              </div>

              {plan.justificationType && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Justification Type
                  </span>
                  <p className="font-medium text-slate-800">
                    {plan.justificationType}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Justification Framework
                </span>
                <p className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
                  {plan.justification}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Supporting File Assets
                </span>
                {plan.supportingDocumentName ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100/60 bg-indigo-50/50 px-2.5 py-1 text-xs font-bold text-indigo-600">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {plan.supportingDocumentName}
                  </div>
                ) : (
                  <p className="text-xs font-medium italic text-slate-400">
                    No attached documents.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Authorized Creator
                </span>
                <p className="font-medium text-slate-800">
                  {plan.createdByName}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Operational Status
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  {plan.status.replace(/_/g, ' ')}
                </span>
              </div>

              {plan.returnedComments && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Return Reason
                  </span>
                  <p className="whitespace-pre-line rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
                    {plan.returnedComments}
                  </p>
                </div>
              )}

              {(plan as any).hrReviewNotes && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    HR Comments
                  </span>
                  <p className="whitespace-pre-line rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
                    {(plan as any).hrReviewNotes}
                  </p>
                </div>
              )}

              {(plan as any).rejectionReason && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    CEO / Rejection Comments
                  </span>
                  <p className="whitespace-pre-line rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
                    {(plan as any).rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Headcount Requirements
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {plan.items.length} line item
                  {plan.items.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid gap-2">
                {plan.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.jobTitle}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                          <span className="capitalize">
                            {item.employmentType.replace('_', ' ')}
                          </span>{' '}
                          - Deployment: {item.plannedStartDate}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                        {item.headcountRequired}{' '}
                        {item.headcountRequired === 1
                          ? 'position'
                          : 'positions'}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 mt-2 text-[11px] text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">
                          Employment type:
                        </span>{' '}
                        {item.employmentType.replace('_', ' ')}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Position type:
                        </span>{' '}
                        {item.positionType || 'new'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Job grade:
                        </span>{' '}
                        {item.jobGrade || item.grade || 'Not set'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Salary budget:
                        </span>{' '}
                        {item.salaryBudget ?? 'Not set'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Priority:
                        </span>{' '}
                        {item.priority || 'Medium'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Planned start:
                        </span>{' '}
                        {item.plannedStartDate}
                      </div>
                    </div>
                    {(item.positionType || 'new') === 'replacement' && (
                      <div className="mt-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          Replacement employee reference:
                        </span>{' '}
                        {item.replacementEmployeeRef || 'Not provided'}
                      </div>
                    )}
                    <div className="mt-3 space-y-2 text-[11px] text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">
                          Required qualifications:
                        </span>{' '}
                        {item.requiredQualifications || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Expected impact:
                        </span>{' '}
                        {item.expectedImpact || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Remarks:
                        </span>{' '}
                        {item.remarks || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          Position justification:
                        </span>{' '}
                        {item.justification || 'Not provided'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {Array.isArray(plan.approvalHistories) &&
              plan.approvalHistories.length > 0 && (
                <div className="md:col-span-2 space-y-3 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Approval History
                  </h4>
                  <div className="space-y-2">
                    {plan.approvalHistories.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">
                            {entry.action.replace(/_/g, ' ').toLowerCase()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {entry.actorName}
                        </p>
                        {entry.comments && (
                          <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                            {entry.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {plan.revisions.length > 0 && (
              <div className="md:col-span-2 space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Revision History
                </h4>
                <div className="space-y-2">
                  {plan.revisions.map((revision) => (
                    <div
                      key={`${revision.version}-${revision.versionNumber}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {revision.version}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(revision.date).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {revision.author} - {revision.role}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {revision.changes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
