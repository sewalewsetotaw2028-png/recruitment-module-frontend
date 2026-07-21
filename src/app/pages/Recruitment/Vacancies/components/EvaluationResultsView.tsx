import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/common/Toast';
import {
  fetchVacancyEvaluationSummary,
  fetchCandidateEvaluations,
  fetchHiringMinuteByVacancy,
} from '../../../../hooks/useInterviewEvaluations';
import type {
  CandidateRanking,
  CandidateEvaluationDetail,
  HiringMinute,
} from '../../../../hooks/useInterviewEvaluations';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { SelectionDecisionForm } from './SelectionDecisionForm';

interface EvaluationResultsViewProps {
  vacancyId: string;
}

export const EvaluationResultsView: React.FC<EvaluationResultsViewProps> = ({
  vacancyId,
}) => {
  const { can } = usePermissions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(
    null,
  );
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateRanking | null>(null);
  const [sortField, setSortField] = useState<
    'aggregate_score' | 'evaluation_count' | 'candidate_name'
  >('aggregate_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [candidateEvaluations, setCandidateEvaluations] = useState<
    Record<string, CandidateEvaluationDetail[]>
  >({});
  const [loadingEvaluations, setLoadingEvaluations] = useState<
    Record<string, boolean>
  >({});
  const [hiringMinute, setHiringMinute] = useState<HiringMinute | null>(null);

  // Single source of truth for the fetch — used by both the initial load and post-selection refresh
  const loadRankings = useCallback(async () => {
    if (!vacancyId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, minute] = await Promise.all([
        fetchVacancyEvaluationSummary(vacancyId),
        fetchHiringMinuteByVacancy(vacancyId),
      ]);
      setRankings(data.rankings || []);
      setHiringMinute(minute);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load evaluation results';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [vacancyId]); // toast intentionally omitted — it is a stable dispatcher

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const handleSelectCandidate = (candidate: CandidateRanking) => {
    setSelectedCandidate(candidate);
    setShowSelectionForm(true);
  };

  const handleSelectionSuccess = () => {
    setShowSelectionForm(false);
    setSelectedCandidate(null);
    loadRankings();
  };

  const handleSort = (
    field: 'aggregate_score' | 'evaluation_count' | 'candidate_name',
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'aggregate_score') {
      comparison = a.aggregate_score - b.aggregate_score;
    } else if (sortField === 'evaluation_count') {
      comparison = a.evaluation_count - b.evaluation_count;
    } else if (sortField === 'candidate_name') {
      comparison = a.candidate_name.localeCompare(b.candidate_name);
    }
    // For ties in score, break by evaluation count (more evaluations = higher confidence)
    if (comparison === 0 && sortField === 'aggregate_score') {
      comparison = b.evaluation_count - a.evaluation_count;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Calculate total weighted score for each candidate to match the expanded view
  const candidateTotalScores = useMemo(() => {
    const scores: Record<string, number> = {};
    Object.entries(candidateEvaluations).forEach(([appId, evaluations]) => {
      scores[appId] = evaluations.reduce((sum, evaluation) => {
        if (evaluation.scores_json && evaluation.scores_json.length > 0) {
          return (
            sum +
            evaluation.scores_json.reduce(
              (scoreSum, score: any) =>
                scoreSum +
                (typeof score.weighted_score === 'number'
                  ? score.weighted_score
                  : 0),
              0,
            )
          );
        }
        return sum;
      }, 0);
    });
    return scores;
  }, [candidateEvaluations]);

  const loadCandidateEvaluations = useCallback(
    async (applicationId: string) => {
      if (candidateEvaluations[applicationId]) return; // Already loaded

      setLoadingEvaluations((prev) => ({ ...prev, [applicationId]: true }));
      try {
        const data = await fetchCandidateEvaluations(applicationId);
        setCandidateEvaluations((prev) => ({ ...prev, [applicationId]: data }));
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load candidate evaluations';
        toast(message, 'error');
      } finally {
        setLoadingEvaluations((prev) => ({ ...prev, [applicationId]: false }));
      }
    },
    [toast, candidateEvaluations],
  );

  const handleExpandCandidate = (applicationId: string) => {
    const newExpanded =
      expandedCandidate === applicationId ? null : applicationId;
    setExpandedCandidate(newExpanded);
    if (newExpanded) {
      loadCandidateEvaluations(applicationId);
    }
  };

  if (!can(PERMISSIONS.INTERVIEW_EVALUATE)) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">
          You do not have permission to view evaluation results.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">
            Loading evaluation results...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 bg-red-50 rounded-xl border border-red-200">
        <div className="text-center">
          <span className="material-symbols-outlined text-red-500 text-3xl block mb-2">
            error
          </span>
          <p className="text-sm text-red-700 font-semibold">{error}</p>
          <button
            type="button"
            onClick={loadRankings}
            className="mt-3 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <span className="material-symbols-outlined text-slate-400 text-3xl block mb-2">
            assessment
          </span>
          <p className="text-sm text-slate-500">
            No evaluation results available yet. Candidates must be interviewed
            and evaluated before rankings appear.
          </p>
        </div>
      </div>
    );
  }

  const remainingOpenings =
    hiringMinute?.remaining_openings ?? Number.POSITIVE_INFINITY;
  const selectedCount = hiringMinute?.current_selected_count ?? 0;
  const canSelectMore = remainingOpenings > 0;

  return (
    <div className="space-y-6">
      {/* Evaluation Completeness Status */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wide">
              Evaluation Progress
            </p>
            <p className="text-sm font-bold text-indigo-900 mt-1">
              {rankings.length} candidate{rankings.length !== 1 ? 's' : ''}{' '}
              evaluated
            </p>
          </div>
          
        </div>
      </div>

      {hiringMinute && (
        <div
          className={`rounded-xl border p-4 ${
            canSelectMore
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className={`text-xs font-extrabold uppercase tracking-wide ${
                  canSelectMore ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                Selection Status
              </p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {selectedCount} of{' '}
                {hiringMinute.vacancy?.open_positions ?? selectedCount}{' '}
                opening(s) currently selected
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Hiring minute is{' '}
                {hiringMinute.final_decision.replace(/_/g, ' ')}.
                {canSelectMore
                  ? ` ${remainingOpenings} opening(s) still available for selection.`
                  : ' No additional selections are available until an offer is declined or a selection is revoked.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Ranking Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold tracking-wider">
                <th className="p-4 w-16">Rank</th>
                <th
                  className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('candidate_name')}
                >
                  Candidate{' '}
                  {sortField === 'candidate_name' &&
                    (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('aggregate_score')}
                >
                  Aggregate Score{' '}
                  {sortField === 'aggregate_score' &&
                    (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4">Panel Recommendations</th>
                <th className="p-4 w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedRankings.map((candidate, index) => (
                // React.Fragment with key so both the main row and the expanded
                // row are keyed correctly and reconciliation works for expanded rows
                <React.Fragment key={candidate.application_id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : index === 1
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">
                        {candidate.candidate_name}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">
                          {candidateTotalScores[candidate.application_id]?.toFixed(2) || candidate.aggregate_score.toFixed(2)}
                        </span>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all"
                            style={{
                              width: `${Math.min(candidateTotalScores[candidate.application_id] || candidate.aggregate_score, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(candidate.panel_recommendations).map(
                          ([recommendation, count]) => (
                            <span
                              key={recommendation}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold"
                            >
                              {count as number} {recommendation}
                            </span>
                          ),
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleExpandCandidate(candidate.application_id)
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold hover:bg-indigo-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {expandedCandidate === candidate.application_id
                              ? 'expand_less'
                              : 'expand_more'}
                          </span>
                          {expandedCandidate === candidate.application_id
                            ? 'Hide'
                            : 'View'}
                        </button>
                        {can(PERMISSIONS.HIRING_MINUTE_CREATE) &&
                          canSelectMore &&
                          candidate.application_status !== 'SELECTED' &&
                          candidate.application_status !== 'OFFER_ISSUED' &&
                          candidate.application_status !== 'OFFER_ACCEPTED' &&
                          candidate.application_status !== 'REJECTED' &&
                          candidate.application_status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleSelectCandidate(candidate)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                check_circle
                              </span>
                              Select
                            </button>
                          )}
                        {can(PERMISSIONS.HIRING_MINUTE_CREATE) &&
                          !canSelectMore &&
                          candidate.application_status !== 'SELECTED' &&
                          candidate.application_status !== 'OFFER_ISSUED' &&
                          candidate.application_status !== 'OFFER_ACCEPTED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[10px] font-bold">
                              Full
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                  {expandedCandidate === candidate.application_id && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 bg-slate-50 border-b border-slate-100"
                      >
                        <div className="space-y-4">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Evaluation Breakdown
                          </p>

                          {loadingEvaluations[candidate.application_id] ? (
                            <div className="flex items-center justify-center p-8">
                              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            </div>
                          ) : candidateEvaluations[candidate.application_id]
                              ?.length > 0 ? (
                            <div className="space-y-4">
                              {candidateEvaluations[
                                candidate.application_id
                              ].map((evaluation, idx) => (
                                <div
                                  key={`${evaluation.interview_id}-${evaluation.evaluator_email}`}
                                  className="bg-white border border-slate-200 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <p className="text-xs font-semibold text-slate-900">
                                        {evaluation.evaluator_name}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        {evaluation.evaluator_email}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        {evaluation.interview_category} •{' '}
                                        {new Date(
                                          evaluation.interview_date,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                          evaluation.recommendation ===
                                            'RECOMMEND' ||
                                          evaluation.recommendation ===
                                            'STRONGLY_RECOMMEND'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : evaluation.recommendation ===
                                                'DO_NOT_RECOMMEND'
                                              ? 'bg-red-50 text-red-700'
                                              : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {evaluation.recommendation.replace(
                                          /_/g,
                                          ' ',
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  {evaluation.scores_json &&
                                    evaluation.scores_json.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                          Criterion Scores
                                        </p>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="bg-slate-50">
                                                <th className="p-2 text-left text-[10px] font-semibold text-slate-600">
                                                  Criterion
                                                </th>
                                                <th className="p-2 text-right text-[10px] font-semibold text-slate-600">
                                                  Score
                                                </th>
                                                <th className="p-2 text-right text-[10px] font-semibold text-slate-600">
                                                  Max
                                                </th>
                                                <th className="p-2 text-right text-[10px] font-semibold text-slate-600">
                                                  Weight
                                                </th>
                                                <th className="p-2 text-right text-[10px] font-semibold text-slate-600">
                                                  Weighted
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {evaluation.scores_json.map(
                                                (
                                                  score: any,
                                                  scoreIdx: number,
                                                ) => (
                                                  <tr key={scoreIdx}>
                                                    <td className="p-2 text-slate-700">
                                                      {score.criterion_name}
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-slate-900">
                                                      {score.score}
                                                    </td>
                                                    <td className="p-2 text-right text-slate-500">
                                                      {score.max_score || 10}
                                                    </td>
                                                    <td className="p-2 text-right text-slate-500">
                                                      {score.weight ?? '-'}%
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-indigo-600">
                                                      {typeof score.weighted_score ===
                                                      'number'
                                                        ? score.weighted_score.toFixed(2)
                                                        : '-'}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                  {evaluation.comments && (
                                    <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-100">
                                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                        Comments
                                      </p>
                                      <p className="text-xs text-slate-700 italic">
                                        "{evaluation.comments}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Aggregate row */}
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">
                                  Aggregate Summary
                                </p>
                                {candidateEvaluations[candidate.application_id] &&
                                candidateEvaluations[candidate.application_id].length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="bg-white border border-indigo-100 rounded-lg p-4">
                                      <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                                        Total Weighted Score
                                      </p>
                                      <p className="text-2xl font-bold text-indigo-700 font-mono">
                                        {candidateEvaluations[candidate.application_id]
                                          .reduce((sum, evaluation) => {
                                            if (evaluation.scores_json && evaluation.scores_json.length > 0) {
                                              return (
                                                sum +
                                                evaluation.scores_json.reduce(
                                                  (scoreSum, score: any) =>
                                                    scoreSum +
                                                    (typeof score.weighted_score === 'number'
                                                      ? score.weighted_score
                                                      : 0),
                                                  0,
                                                )
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                          .toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      {Object.entries(
                                        candidate.panel_recommendations,
                                      ).map(([rec, count]) => (
                                        <span
                                          key={rec}
                                          className="px-2.5 py-1 bg-white text-indigo-700 border border-indigo-200 rounded text-xs font-semibold"
                                        >
                                          {count as number}×{' '}
                                          {rec.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 text-center py-4">
                                    No detailed evaluations available for this
                                    candidate.
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 text-center py-4">
                              No detailed evaluations available for this
                              candidate.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selection Decision Form Modal */}
      {showSelectionForm && selectedCandidate && (
        <SelectionDecisionForm
          vacancyId={vacancyId}
          candidate={{
            application_id: selectedCandidate.application_id,
            candidate_name: selectedCandidate.candidate_name,
            candidate_id: selectedCandidate.candidate_id,
          }}
          allCandidates={rankings.map((r) => ({
            application_id: r.application_id,
            candidate_name: r.candidate_name,
            candidate_id: r.candidate_id,
          }))}
          isOpen={showSelectionForm}
          onClose={() => {
            setShowSelectionForm(false);
            setSelectedCandidate(null);
          }}
          onSuccess={handleSelectionSuccess}
        />
      )}
    </div>
  );
};

export default EvaluationResultsView;
