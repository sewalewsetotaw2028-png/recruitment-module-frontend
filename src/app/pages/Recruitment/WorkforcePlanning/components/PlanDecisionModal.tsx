import React, { useMemo, useState } from 'react';

type Mode = 'hr_review' | 'ceo_review' | 'reject';
type Action = 'forward' | 'return' | 'approve' | 'reject';

interface PlanDecisionModalProps {
  mode: Mode;
  planTitle?: string;
  confirmLabel?: string;
  error?: string | null;
  loading?: boolean;
  planStatus?: string;
  canReturnPlan?: boolean;
  canForwardPlan?: boolean;
  canApprovePlan?: boolean;
  canRejectPlan?: boolean;
  onConfirm: (value?: string, action?: Action) => void;
  onClose: () => void;
}

export const PlanDecisionModal: React.FC<PlanDecisionModalProps> = ({
  mode,
  planTitle,
  confirmLabel,
  error,
  loading = false,
  planStatus = '',
  canReturnPlan = true,
  canForwardPlan = true,
  canApprovePlan = true,
  canRejectPlan = true,
  onConfirm,
  onClose,
}) => {
  const [value, setValue] = useState('');

  const copy = useMemo(() => {
    if (mode === 'reject') {
      return {
        title: 'Reject workforce plan',
        label: 'Rejection reason',
        placeholder:
          'Provide a clear reason for the work unit and audit trail...',
        confirm: confirmLabel ?? 'Reject plan',
        returnLabel: 'Return for revision',
        tone: 'danger' as const,
      };
    }

    return {
      title: 'Workforce Plan Actions',
      label: 'Review notes',
      placeholder:
        'Add comments for the work unit before taking action, or return the plan for revision...',
      confirm: confirmLabel ?? 'Forward to CEO',
      returnLabel: 'Return for revision',
      tone: 'primary' as const,
    };
  }, [mode, confirmLabel]);

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{copy.title}</h3>
            {planTitle && (
              <p className="mt-1 text-xs text-slate-500">
                Plan: <span className="font-semibold">{planTitle}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Inline error message */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
            <span className="material-symbols-outlined mt-0.5 text-lg text-rose-500 shrink-0">
              error
            </span>
            <div>
              <p className="text-xs font-bold text-rose-800">Action failed</p>
              <p className="mt-1 text-xs font-medium text-rose-700 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {copy.label}
          </label>
          <textarea
            className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={copy.placeholder}
          />
          {mode === 'reject' ? (
            <p className="text-xs text-slate-500">
              This will mark the plan as rejected and notify the creator.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Choose an action below or return the plan with comments for revision.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            Cancel
          </button>
          {/* Return only makes sense when plan is in a reviewable state */}
          {canReturnPlan &&
           ['submitted','under_hr_review','under_ceo_review','pending_ceo'].includes(planStatus) && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(value.trim() || undefined, 'return')}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing…' : copy.returnLabel}
            </button>
          )}
          {/* Forward only available on submitted status */}
          {canForwardPlan && planStatus === 'submitted' && mode !== 'reject' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(value.trim() || undefined, 'forward')}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Forward to CEO'}
            </button>
          )}
          {/* Approve only available on under_ceo_review (per BRD — HR forwards, CEO approves) */}
          {canApprovePlan &&
           ['under_ceo_review','pending_ceo'].includes(planStatus) &&
           mode !== 'reject' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(value.trim() || undefined, 'approve')}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Approve plan'}
            </button>
          )}
          {canRejectPlan && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(value.trim() || undefined, 'reject')}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Reject plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
