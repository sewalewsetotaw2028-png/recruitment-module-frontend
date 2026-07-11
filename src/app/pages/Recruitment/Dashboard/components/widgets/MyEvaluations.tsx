import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PendingEvaluation } from '@/hooks/useInterviewEvaluations';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface MyEvaluationsProps {
  evaluations?: PendingEvaluation[];
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/**
 * Shows pending interview evaluations for the current panel member.
 * Each item links to EvaluationSubmissionForm so the user can act immediately.
 */
export const MyEvaluations: React.FC<MyEvaluationsProps> = ({
  evaluations: evaluationsProp = [],
}) => {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<PendingEvaluation | null>(null);

  // Defensive normalization — guard against non-array values from the parent
  const evaluations: PendingEvaluation[] = Array.isArray(evaluationsProp)
    ? evaluationsProp
    : Array.isArray((evaluationsProp as any)?.data)
      ? (evaluationsProp as any).data
      : [];

  const filteredEvaluations = useMemo(
    () =>
      evaluations.filter((e) => {
        const q = searchTerm.toLowerCase();
        return (
          e.candidate_name.toLowerCase().includes(q) ||
          e.vacancy_title.toLowerCase().includes(q) ||
          (e.category_name ?? '').toLowerCase().includes(q)
        );
      }),
    [evaluations, searchTerm],
  );

  if (!evaluations.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="p-6 text-center text-slate-500">
          <span className="material-symbols-outlined text-slate-300 text-4xl block mb-2">
            assignment_ind
          </span>
          <p className="text-sm">No pending evaluations</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Pending Evaluations
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Interviews awaiting your review.
            </p>
          </div>
          {/* Count badge reflects current filtered count when searching */}
          <span className="px-2.5 py-1 bg-amber-100 rounded-lg text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            {searchTerm ? filteredEvaluations.length : evaluations.length}
          </span>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <input
            type="text"
            placeholder="Search by candidate, vacancy, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
          {filteredEvaluations.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 italic text-center">
              No evaluations match your search.
            </div>
          ) : (
            filteredEvaluations.map((evaluation) => (
              <div
                key={evaluation.interview_id}
                className="p-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEvaluation(evaluation)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {evaluation.candidate_name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {evaluation.vacancy_title}
                    </p>
                    {evaluation.category_name && (
                      <p className="text-xs text-slate-400">
                        {evaluation.category_name}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(evaluation.interview_date)}
                    </p>
                  </button>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="px-2 py-1 bg-amber-50 rounded text-xs font-medium text-amber-700">
                      Pending
                    </span>
                    {can(PERMISSIONS.INTERVIEW_EVALUATE) && (
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/interviews/${evaluation.interview_id}/evaluate`)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Submit Evaluation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEvaluation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvaluation(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Evaluation Details</h3>
                {selectedEvaluation.category_name && (
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedEvaluation.category_name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvaluation(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Candidate</h4>
                <p className="text-base font-medium text-slate-900">
                  {selectedEvaluation.candidate_name}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Position</h4>
                <p className="text-base font-medium text-slate-900">
                  {selectedEvaluation.vacancy_title}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Interview Date</h4>
                <p className="text-sm text-slate-900">
                  {formatDateTime(selectedEvaluation.interview_date)}
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">Status</h4>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                  Pending Evaluation
                </span>
              </div>

              {can(PERMISSIONS.INTERVIEW_EVALUATE) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvaluation(null);
                    navigate(`/dashboard/interviews/${selectedEvaluation.interview_id}/evaluate`);
                  }}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Submit Evaluation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default MyEvaluations;
