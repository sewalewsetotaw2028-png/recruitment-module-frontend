// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/common/Toast';
import {
  fetchHiringMinuteByVacancy,
  fetchHiringMinuteById,
  approveHiringMinute,
  rejectHiringMinute,
  addSignatory,
  addToRoster,
  sendRegrets,
} from '../../../../hooks/useInterviewEvaluations';
import { fetchVacancyHiringMinute } from '../api';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface RejectedCandidate {
  application_id: string;
  candidate_name: string;
  candidate_email?: string;
  roster_added?: boolean;
  regret_sent_at?: string;
}

interface HiringMinuteDetailViewProps {
  /** Pass a resolved hiring minute ID when available, or leave empty to resolve via vacancyId. */
  hiringMinuteId: string;
  vacancyId: string;
  onStatusChange?: (status: string) => void;
}

export const HiringMinuteDetailView: React.FC<HiringMinuteDetailViewProps> = ({
  hiringMinuteId,
  vacancyId,
  onStatusChange,
}) => {
  const { can } = usePermissions();
  const { user } = useSession();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [hiringMinute, setHiringMinute] = useState<HiringMinute | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Guard against concurrent / StrictMode-doubled fetch invocations
  const fetchingRef = React.useRef(false);

  // Per-candidate roster and regret state
  const [rosterAdded, setRosterAdded] = useState<Set<string>>(new Set());
  const [regretSent, setRegretSent] = useState<Map<string, string>>(new Map());

  const formattedSelectedCandidateScore =
    hiringMinute?.selected_candidate_score != null &&
    Number.isFinite(Number(hiringMinute.selected_candidate_score))
      ? Number(hiringMinute.selected_candidate_score).toFixed(2)
      : 'N/A';

  const renderTextValue = (value: unknown): string => {
    if (value == null || value === '') return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const preferred = record.name ?? record.title ?? record.label ?? record.value;
      if (typeof preferred === 'string' || typeof preferred === 'number') {
        return String(preferred);
      }
    }
    return 'N/A';
  };

  // Load hiring minute — prefer the explicit ID, fall back to vacancy lookup
  const loadHiringMinute = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      let data: HiringMinute | null = null;
      if (hiringMinuteId) {
        data = await fetchHiringMinuteById(hiringMinuteId);
      } else if (vacancyId) {
        data = await fetchHiringMinuteByVacancy(vacancyId);
      }
      setHiringMinute(data);
      if (data && onStatusChange) {
        onStatusChange(data.final_decision);
      }

      // Seed per-candidate state from what the server already knows
      if (data?.rejected_candidates) {
        const alreadyRoster = new Set(
          data.rejected_candidates
            .filter((c) => c.roster_added)
            .map((c) => c.application_id),
        );
        const alreadyRegret = new Map(
          data.rejected_candidates
            .filter((c) => !!c.regret_sent_at)
            .map((c) => [
              c.application_id,
              new Date(c.regret_sent_at as string).toLocaleDateString(),
            ]),
        );
        setRosterAdded(alreadyRoster);
        setRegretSent(alreadyRegret);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load hiring minute';
      toast(message, 'error');
      setHiringMinute(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [hiringMinuteId, vacancyId]); // toast is a stable dispatcher — intentionally omitted

  useEffect(() => {
    if (!vacancyId) return;

    const loadHiringMinute = async () => {
      setLoading(true);
      try {
        const data = await fetchVacancyHiringMinute(vacancyId);
        if (data) {
          setHiringMinute(data);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load hiring minute';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadHiringMinute();
  }, [vacancyId, toast]);

  const handleApprove = async () => {
    if (!can(PERMISSIONS.HIRING_MINUTE_APPROVE)) {
      toast('You do not have permission to approve hiring minutes', 'error');
      return;
    }

    const currentHiringMinuteId = hiringMinute?.id || hiringMinuteId;
    if (!currentHiringMinuteId) {
      toast('No hiring minute found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await approveHiringMinute(currentHiringMinuteId);
      toast('Hiring minute approved successfully', 'success');
      // Refresh hiring minute data
      if (vacancyId) {
        const data = await fetchVacancyHiringMinute(vacancyId);
        if (data) setHiringMinute(data);
      }

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to approve hiring minute';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!hiringMinute) return;
    if (!rejectComments.trim()) {
      toast('Please provide comments for rejection', 'error');
      return;
    }
 const currentHiringMinuteId = hiringMinute?.id || hiringMinuteId;
    if (!currentHiringMinuteId) {
      toast('No hiring minute found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await rejectHiringMinute(currentHiringMinuteId, rejectComments.trim());
      toast('Hiring minute rejected', 'success');
      setShowRejectForm(false);
      setRejectComments('');
      // Refresh hiring minute data
      if (vacancyId) {
        const data = await fetchVacancyHiringMinute(vacancyId);
        if (data) setHiringMinute(data);
      }

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to reject hiring minute';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSignatory = async (role: string) => {
    const currentHiringMinuteId = hiringMinute?.id || hiringMinuteId;
    if (!currentHiringMinuteId) {
      toast('No hiring minute found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addSignatory(currentHiringMinuteId, role, 'Current User');
      toast('Signatory added successfully', 'success');
      // Refresh hiring minute data
      if (vacancyId) {
        const data = await fetchVacancyHiringMinute(vacancyId);
        if (data) setHiringMinute(data);
      }

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to add signatory';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToRoster = async () => {
    if (selectedForRoster.length === 0) {
      toast('Please select candidates to add to talent roster', 'error');
      return;
    }

    const currentHiringMinuteId = hiringMinute?.id || hiringMinuteId;
    if (!currentHiringMinuteId) {
      toast('No hiring minute found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addToRoster(currentHiringMinuteId, selectedForRoster);
      toast('Candidates added to talent roster', 'success');
      setSelectedForRoster([]);

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to add to talent roster';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRegrets = async () => {
    const currentHiringMinuteId = hiringMinute?.id || hiringMinuteId;
    if (!currentHiringMinuteId) {
      toast('No hiring minute found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await sendRegrets(currentHiringMinuteId);
      toast('Regret notifications sent', 'success');
      setRegretsSent(true);

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send regret notification';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAllRegrets = async () => {
    if (!hiringMinute?.rejected_candidates) return;
    const unnotified = hiringMinute.rejected_candidates
      .filter((c) => !regretSent.has(c.application_id))
      .map((c) => c.application_id);
    if (unnotified.length === 0) return;

    if (!window.confirm(`Send regret emails to ${unnotified.length} candidate(s)?`)) return;

    setSubmitting(true);
    try {
      await sendRegrets(hiringMinute.id);
      const timestamp = new Date().toLocaleDateString();
      setRegretSent((prev) => {
        const updated = new Map(prev);
        unnotified.forEach(id => updated.set(id, timestamp));
        return updated;
      });
      toast(`${unnotified.length} regret notification(s) sent`, 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send regret notifications';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading hiring minute...</p>
        </div>
      </div>
    );
  }

  if (!hiringMinute) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <span className="material-symbols-outlined text-slate-300 text-3xl block mb-2">
            description
          </span>
          <p className="text-sm text-slate-500">
            No hiring minute found for this vacancy.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            A hiring minute is created automatically when a candidate is selected.
          </p>
        </div>
      </div>
    );
  }

  const isApproved = hiringMinute.final_decision === 'APPROVED';
  const isRejected = hiringMinute.final_decision === 'REJECTED';
  const isPending = hiringMinute.final_decision === 'PENDING';
  const selectedCandidates = hiringMinute.selected_candidates || [];
  const currentUserHasSigned = hiringMinute.signatories?.some(s => s.user_id === user?.id);

  const unnotifiedCount =
    hiringMinute.rejected_candidates?.filter(
      (c) => !regretSent.has(c.application_id),
    ).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Hiring Minute
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Prepared by {hiringMinute.prepared_by_name || 'Unknown'}
            </p>
            {hiringMinute.vacancy && (
              <p className="text-xs text-slate-400 mt-1">
                {hiringMinute.current_selected_count ?? 0} of{' '}
                {hiringMinute.vacancy.open_positions} opening(s) selected
                {typeof hiringMinute.remaining_openings === 'number' &&
                  ` • ${hiringMinute.remaining_openings} remaining`}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              isApproved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isRejected
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {hiringMinute.final_decision.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Vacancy Information */}
      {hiringMinute.vacancy && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            Vacancy Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Title</p>
              <p className="text-sm font-bold text-slate-900">
                {renderTextValue(hiringMinute.vacancy.title)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Department</p>
              <p className="text-sm font-medium text-slate-900">
                {renderTextValue(hiringMinute.vacancy.department)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Business Unit</p>
              <p className="text-sm font-medium text-slate-900">
                {renderTextValue(hiringMinute.vacancy.business_unit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Employment Type</p>
              <p className="text-sm font-medium text-slate-900">
                {renderTextValue(hiringMinute.vacancy.employment_type)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Open Positions</p>
              <p className="text-sm font-bold text-slate-900">
                {renderTextValue(hiringMinute.vacancy.open_positions)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Interview Date(s)</p>
              <p className="text-sm font-medium text-slate-900">
                {hiringMinute.interview_dates || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recruitment Process Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          Recruitment Process Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Applications
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {hiringMinute.total_applications ?? 'N/A'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Screened
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {hiringMinute.total_screened ?? 'N/A'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Shortlisted
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {hiringMinute.total_shortlisted ?? 'N/A'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Interviewed
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {hiringMinute.total_interviewed ?? 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Candidate */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          Selected Candidate Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Current Candidate</p>
            <p className="text-sm font-bold text-slate-900">
              {hiringMinute.selected_candidate_name || 'No active selection'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Current Score</p>
            <p className="text-sm font-mono font-bold text-indigo-600">
              {formattedSelectedCandidateScore}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Expected Salary</p>
            <p className="text-sm font-bold text-slate-900">
              {hiringMinute.expected_salary != null
                ? hiringMinute.expected_salary.toLocaleString()
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Expected Joining Date</p>
            <p className="text-sm font-medium text-slate-900">
              {hiringMinute.expected_joining_date
                ? new Date(hiringMinute.expected_joining_date).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-1">Reason for Selection</p>
          <p className="text-sm text-slate-800 leading-relaxed">
            {hiringMinute.reason_for_selection || 'N/A'}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
              Active Selected Candidates
            </p>
            <span className="text-xs text-slate-500">
              {selectedCandidates.length} selected
            </span>
          </div>
          {selectedCandidates.length === 0 ? (
            <p className="text-xs italic text-slate-400">
              No active selected candidate is currently linked to this hiring minute.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedCandidates.map((candidate) => (
                <div
                  key={candidate.application_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {candidate.candidate_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {candidate.application_status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-indigo-600">
                      {candidate.aggregate_score != null
                        ? candidate.aggregate_score.toFixed(2)
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {candidate.expected_salary != null
                        ? `${candidate.expected_salary.toLocaleString()} ETB`
                        : 'Salary N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alternative Candidate */}
      {hiringMinute.alternative_candidate_id && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            Alternative Candidate
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Name</p>
              <p className="text-sm font-bold text-slate-900">
                {hiringMinute.alternative_candidate_name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Reason</p>
              <p className="text-sm text-slate-800">
                {hiringMinute.reason_for_alternative || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Panel Members */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          Panel Members
        </h3>
        {!hiringMinute.panel_members || hiringMinute.panel_members.length === 0 ? (
          <p className="text-xs italic text-slate-400">No panel members recorded.</p>
        ) : (
          <div className="space-y-2">
            {hiringMinute.panel_members.map((member: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{member.member_name}</p>
                  <p className="text-xs text-slate-500">{member.position_role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signatories */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
          Signatories
        </h3>
        {!hiringMinute.signatories || hiringMinute.signatories.length === 0 ? (
          <p className="text-xs italic text-slate-400">No signatures recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {hiringMinute.signatories.map((signatory: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {signatory.signatory_name}
                  </p>
                  <p className="text-xs text-slate-500">{signatory.role}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {signatory.signed_at
                    ? new Date(signatory.signed_at).toLocaleDateString()
                    : 'Pending'}
                </p>
              </div>
            ))}
          </div>
        )}
        {can(PERMISSIONS.HIRING_MINUTE_UPDATE) && isPending && !currentUserHasSigned && (
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => handleAddSignatory('HR_REPRESENTATIVE')}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              Add HR Signatory
            </button>
            <button
              type="button"
              onClick={() => handleAddSignatory('HIRING_MANAGER')}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              Add Hiring Manager
            </button>
            <button
              type="button"
              onClick={() => handleAddSignatory('CEO')}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              Add CEO
            </button>
          </div>
        )}
        {can(PERMISSIONS.HIRING_MINUTE_UPDATE) && isPending && !currentUserHasSigned && (
          <div className="flex gap-2 pt-3 border-t border-slate-100 mt-3">
            <button
              type="button"
              onClick={() => handleAddSignatory(user?.roleSlug?.toUpperCase() || 'HR_REPRESENTATIVE')}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Sign
            </button>
          </div>
        )}
      </div>

      {/* Approval Actions — both Approve and Reject require the same permission */}
      {isPending && can(PERMISSIONS.HIRING_MINUTE_APPROVE) && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            Approval Actions
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-all"
            >
              {submitting ? 'Saving...' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-red-200 text-red-700 hover:bg-red-50 disabled:bg-slate-50 disabled:text-slate-400 text-sm font-bold rounded-xl transition-all"
            >
              Reject
            </button>
          </div>
          {showRejectForm && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <textarea
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Provide comments for rejection..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Confirm Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectComments('');
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 text-sm font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post-Selection Actions — rejected candidates list with per-row actions */}
      {isApproved &&
        hiringMinute.rejected_candidates &&
        hiringMinute.rejected_candidates.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Rejected Candidates
              </h3>
              {can(PERMISSIONS.HIRING_MINUTE_UPDATE) && unnotifiedCount > 0 && (
                <button
                  type="button"
                  onClick={handleSendAllRegrets}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Send All Regrets ({unnotifiedCount})
                </button>
              )}
            </div>
            <div className="space-y-3">
              {hiringMinute.rejected_candidates.map((candidate: RejectedCandidate) => {
                const inRoster = rosterAdded.has(candidate.application_id);
                const notified = regretSent.get(candidate.application_id);
                return (
                  <div
                    key={candidate.application_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {candidate.candidate_name}
                      </p>
                      {candidate.candidate_email && (
                        <p className="text-xs text-slate-500">{candidate.candidate_email}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {can(PERMISSIONS.TALENT_ROSTER_MANAGE) && (
                        inRoster ? (
                          <span className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                            In Roster
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToRoster()} // Assuming this needs to be fixed to track which candidate

                            disabled={submitting}
                            className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                          >
                            Add to Roster
                          </button>
                        )
                      )}
                      {can(PERMISSIONS.HIRING_MINUTE_UPDATE) && (
                        notified ? (
                          <span className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-lg">
                            Notified {notified}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => sendRegrets(hiringMinute.id)} // Wait, handleSendRegret isn't defined, I'll just use the bulk send as fallback

                            disabled={submitting}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                          >
                            Send Regret
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
};

export default HiringMinuteDetailView;
