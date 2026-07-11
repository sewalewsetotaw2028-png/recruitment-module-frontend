import React, { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/common/Toast';
import { selectCandidate } from '../../../../hooks/useInterviewEvaluations';
import { PERMISSIONS } from '@/lib/permissions-shared';

const MIN_REASON_LENGTH = 10;

interface SelectionDecisionFormProps {
  vacancyId: string;
  candidate: {
    application_id: string;
    candidate_name: string;
    candidate_id: string;
  };
  allCandidates: Array<{
    application_id: string;
    candidate_name: string;
    candidate_id: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  reasonForSelection?: string;
  reasonForAlternative?: string;
  expectedSalary?: string;
  expectedJoiningDate?: string;
}

type ApiValidationError = {
  field?: string;
  message?: string;
};

export const SelectionDecisionForm: React.FC<SelectionDecisionFormProps> = ({
  vacancyId,
  candidate,
  allCandidates,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { can } = usePermissions();
  const { toast } = useToast();

  const [reasonForSelection, setReasonForSelection] = useState('');
  const [alternativeApplicationId, setAlternativeApplicationId] = useState('');
  const [reasonForAlternative, setReasonForAlternative] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  if (!isOpen) return null;

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    const trimmedSelectionReason = reasonForSelection.trim();
    const trimmedAlternativeReason = reasonForAlternative.trim();

    if (!trimmedSelectionReason) {
      newErrors.reasonForSelection = 'A reason for selection is required.';
    } else if (trimmedSelectionReason.length < MIN_REASON_LENGTH) {
      newErrors.reasonForSelection = `Reason for selection must be at least ${MIN_REASON_LENGTH} characters.`;
    }

    if (alternativeApplicationId && !trimmedAlternativeReason) {
      newErrors.reasonForAlternative =
        'A reason is required when an alternative candidate is specified.';
    } else if (
      alternativeApplicationId &&
      trimmedAlternativeReason.length < MIN_REASON_LENGTH
    ) {
      newErrors.reasonForAlternative = `Reason for alternative must be at least ${MIN_REASON_LENGTH} characters.`;
    }

    if (!expectedSalary || isNaN(Number(expectedSalary)) || Number(expectedSalary) < 0) {
      newErrors.expectedSalary = 'A valid expected salary is required.';
    }

    return newErrors;
  };

  const extractApiFieldErrors = (error: unknown): FormErrors => {
    if (!(error instanceof Error)) return {};

    try {
      const details = (error as Error & { details?: string }).details;
      if (!details) return {};

      const parsed = JSON.parse(details) as { errors?: ApiValidationError[] };
      if (!Array.isArray(parsed.errors)) return {};

      return parsed.errors.reduce<FormErrors>((acc, item) => {
        if (item.field === 'reason_for_selection') {
          acc.reasonForSelection = item.message;
        }
        if (item.field === 'reason_for_alternative') {
          acc.reasonForAlternative = item.message;
        }
        if (item.field === 'expected_salary') {
          acc.expectedSalary = item.message;
        }
        if (item.field === 'expected_joining_date') {
          acc.expectedJoiningDate = item.message;
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    // Show confirmation step
    setShowConfirm(true);
  };

  const handleConfirmSelection = async () => {
    setSubmitting(true);
    try {
      await selectCandidate(vacancyId, {
        selected_application_id: candidate.application_id,
        alternative_application_id: alternativeApplicationId || undefined,
        reason_for_selection: reasonForSelection.trim(),
        reason_for_alternative: reasonForAlternative.trim() || undefined,
        expected_salary: Number(expectedSalary),
        expected_joining_date: expectedJoiningDate || undefined,
      });

      toast('Candidate selected successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiFieldErrors = extractApiFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setErrors(apiFieldErrors);
        setShowConfirm(false);
      }

      const message =
        err instanceof Error ? err.message : 'Failed to select candidate';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const otherCandidates = allCandidates.filter(
    (c) => c.application_id !== candidate.application_id,
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-200 px-6 py-5 bg-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Select Candidate
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {candidate.candidate_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected Candidate — read-only */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wide mb-1">
              Selected Candidate
            </p>
            <p className="text-sm font-bold text-indigo-900">
              {candidate.candidate_name}
            </p>
          </div>

          {/* Reason for Selection */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
              Reason for Selection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reasonForSelection}
              onChange={(e) => {
                setReasonForSelection(e.target.value);
                if (errors.reasonForSelection) {
                  setErrors((prev) => ({ ...prev, reasonForSelection: undefined }));
                }
              }}
              placeholder="Explain why this candidate was selected..."
              disabled={submitting}
              rows={4}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                errors.reasonForSelection
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-indigo-600/20 focus:border-indigo-600'
              }`}
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter at least {MIN_REASON_LENGTH} characters.
            </p>
            {errors.reasonForSelection && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">error</span>
                {errors.reasonForSelection}
              </p>
            )}
          </div>

          {/* Alternative Candidate */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
              Alternative Candidate (Optional)
            </label>
            <select
              value={alternativeApplicationId}
              onChange={(e) => {
                setAlternativeApplicationId(e.target.value);
                if (!e.target.value) {
                  setReasonForAlternative('');
                  setErrors((prev) => ({ ...prev, reasonForAlternative: undefined }));
                }
              }}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">No alternative</option>
              {otherCandidates.map((c) => (
                <option key={c.application_id} value={c.application_id}>
                  {c.candidate_name}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Alternative — shown only when an alternative is selected */}
          {alternativeApplicationId && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                Reason for Alternative <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reasonForAlternative}
                onChange={(e) => {
                  setReasonForAlternative(e.target.value);
                  if (errors.reasonForAlternative) {
                    setErrors((prev) => ({ ...prev, reasonForAlternative: undefined }));
                  }
                }}
                placeholder="Explain why this candidate is the alternative..."
                disabled={submitting}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                  errors.reasonForAlternative
                    ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-indigo-600/20 focus:border-indigo-600'
                }`}
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter at least {MIN_REASON_LENGTH} characters.
              </p>
              {errors.reasonForAlternative && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  {errors.reasonForAlternative}
                </p>
              )}
            </div>
          )}

          {/* Expected Salary */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
              Expected Starting Salary <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm select-none">
                ETB
              </span>
              <input
                type="number"
                value={expectedSalary}
                onChange={(e) => {
                  setExpectedSalary(e.target.value);
                  if (errors.expectedSalary) {
                    setErrors((prev) => ({ ...prev, expectedSalary: undefined }));
                  }
                }}
                placeholder="0.00"
                disabled={submitting}
                min="0"
                step="0.01"
                className={`w-full pl-14 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                  errors.expectedSalary
                    ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-indigo-600/20 focus:border-indigo-600'
                }`}
              />
            </div>
            {errors.expectedSalary && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">error</span>
                {errors.expectedSalary}
              </p>
            )}
          </div>

          {/* Expected Joining Date */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
              Expected Joining Date <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              type="date"
              value={expectedJoiningDate}
              onChange={(e) => {
                setExpectedJoiningDate(e.target.value);
                if (errors.expectedJoiningDate) {
                  setErrors((prev) => ({ ...prev, expectedJoiningDate: undefined }));
                }
              }}
              disabled={submitting}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                errors.expectedJoiningDate
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-indigo-600/20 focus:border-indigo-600'
              }`}
            />
            {errors.expectedJoiningDate && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">error</span>
                {errors.expectedJoiningDate}
              </p>
            )}
          </div>

          {/* Confirmation Section */}
          {showConfirm && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-bold text-amber-900">Confirm Selection</p>
              <p className="text-xs text-amber-700 mt-1">
                This will select {candidate.candidate_name} and reject all other applicants.
                A hiring minute will be created. This action is difficult to reverse.
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">
                        progress_activity
                      </span>
                      Confirming...
                    </>
                  ) : (
                    'Confirm Selection'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-amber-300 bg-white text-amber-800 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold rounded-xl transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || showConfirm}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || showConfirm || !can(PERMISSIONS.HIRING_MINUTE_CREATE)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
            >
              Select Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectionDecisionForm;
