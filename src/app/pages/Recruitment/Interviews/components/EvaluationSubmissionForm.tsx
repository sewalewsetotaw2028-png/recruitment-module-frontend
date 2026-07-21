import React, { useEffect, useMemo, useState } from 'react';
import type {
  Interview,
  InterviewEvaluation,
  SubmitEvaluationPayload,
} from '@/hooks/useInterviewEvaluations';
import {
  fetchInterviewById,
  submitEvaluation,
  updateEvaluation,
  fetchEvaluationSummary,
} from '@/hooks/useInterviewEvaluations';
import {
  fetchEvaluationTemplates,
  type EvaluationTemplate as EvaluationTemplateConfig,
} from '@/hooks/useEvaluationTemplates';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/common/Toast';
import { useSession } from '@/hooks/useSession';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface EvaluationSubmissionFormProps {
  interviewId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CriterionScore {
  name: string;
  weight: number;
  max_score: number;
  score: number;
  order: number;
}

export const EvaluationSubmissionForm: React.FC<
  EvaluationSubmissionFormProps
> = ({ interviewId, isOpen, onClose, onSuccess }) => {
  const { can } = usePermissions();
  const { toast } = useToast();
  const { user } = useSession();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [template, setTemplate] = useState<EvaluationTemplateConfig | null>(null);
  const [existingEvaluation, setExistingEvaluation] =
    useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<CriterionScore[]>([]);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('RECOMMEND');

  // Calculate live weighted score
  const weightedScore = useMemo(() => {
    if (criteria.length === 0) return 0;
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (totalWeight === 0) return 0;
    const weightedSum = criteria.reduce(
      (sum, c) => sum + (c.score * Number(c.weight)) / 100,
      0,
    );
    return Math.round(weightedSum * 100) / 100;
  }, [criteria]);

  // Load interview, template, and existing evaluation
  useEffect(() => {
    if (!isOpen || !interviewId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch interview details
        const interviewData = await fetchInterviewById(interviewId);
        setInterview(interviewData);

        // Accept COMPLETED, EVALUATION_PENDING, and FINALIZED — all mean the
        // interview is done and panel members can submit their evaluations.
        // The API mapper collapses these to 'completed' in the Redux slice, but
        // fetchInterviewById returns the raw backend value.
        const evaluableStatuses = [
          'COMPLETED',
          'EVALUATION_PENDING',
          'FINALIZED',
          'completed', // normalised value from api.ts mapper
        ];
        if (!evaluableStatuses.includes(interviewData.status)) {
          setError(
            `Evaluations can only be submitted for completed interviews. Current status: ${interviewData.status}`,
          );
          return;
        }

        // Fetch evaluation templates to find the matching one
        const templates = await fetchEvaluationTemplates();
        const categoryId = interviewData.interview_category_id;

        // Find template for this category, or fall back to standard template
        const matchedTemplate = categoryId
          ? templates.find((t) => t.interview_category_id === categoryId)
          : null;
        const fallbackTemplate = templates.find(
          (t) => t.interview_category_id === null,
        );
        const selectedTemplate = matchedTemplate || fallbackTemplate;

        if (!selectedTemplate) {
          setError(
            'No evaluation template is configured for this interview category.',
          );
          return;
        }

        setTemplate(selectedTemplate);

        // Initialize criteria — start at score 1 (slider minimum) to avoid
        // false "all criteria must be scored" validation on fresh load.
        // Normalize max_score from snake_case (backend) or camelCase (older path).
        const initialCriteria: CriterionScore[] = selectedTemplate.criteria
          .sort((a, b) => a.order - b.order)
          .map((c) => ({
            name: c.name,
            weight: Number(c.weight) || 0,
            max_score: Number(c.max_score ?? c.maxScore ?? 10),
            score: 1,
            order: c.order,
          }));
        setCriteria(initialCriteria);

        // Check for an evaluation already submitted by THIS user
        const evaluations = await fetchEvaluationSummary(interviewId);
        const myEvaluation = user?.id
          ? evaluations.find((e) => e.evaluator_id === user.id)
          : undefined;

        if (myEvaluation) {
          setExistingEvaluation(myEvaluation);
          setComments(myEvaluation.comments || '');
          setRecommendation(myEvaluation.recommendation);

          // Populate scores from existing evaluation
          if (
            myEvaluation.scores_json &&
            typeof myEvaluation.scores_json === 'object'
          ) {
            const scoresMap = myEvaluation.scores_json as Record<
              string,
              number | Record<string, number>
            >;
            const updatedCriteria = initialCriteria.map((c) => {
              const score = scoresMap[c.name];
              return {
                ...c,
                score: typeof score === 'number' ? score : 1,
              };
            });
            setCriteria(updatedCriteria);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load evaluation form';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, interviewId, user?.id]);

  const handleScoreChange = (index: number, value: number) => {
    const maxScore = criteria[index].max_score;
    const normalizedValue = Math.min(maxScore, Math.max(1, value));
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, score: normalizedValue } : c)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!can(PERMISSIONS.INTERVIEW_EVALUATE)) {
      toast('You do not have permission to submit evaluations', 'error');
      return;
    }

    if (!interview) return;

    // Validate all criteria have scores
    if (criteria.some((c) => c.score < 1)) {
      toast('Please provide scores for all criteria', 'error');
      return;
    }

    if (!recommendation) {
      toast('Please select a recommendation', 'error');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: SubmitEvaluationPayload = {
        scores: criteria.map((c) => ({
          name: c.name,
          score: c.score,
        })),
        comments: comments.trim(),
        recommendation,
      };

      if (existingEvaluation) {
        // Update existing evaluation
        await updateEvaluation(interviewId, existingEvaluation.id, payload);
        toast('Evaluation updated successfully', 'success');
      } else {
        // Submit new evaluation
        await submitEvaluation(interviewId, payload);
        toast('Evaluation submitted successfully', 'success');
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit evaluation';
      // Show inline error inside the form — no toast so it doesn't double-fire
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const candidateName =
    interview?.application?.candidate
      ? `${interview.application.candidate.first_name} ${interview.application.candidate.last_name}`
      : undefined;
  const vacancyTitle = interview?.application?.vacancy?.title;
  const categoryName = interview?.interview_category?.name ?? null;
  const round = interview?.round ?? null;
  const interviewDate = interview?.start_time
    ? new Date(interview.start_time).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';
  const interviewTime = interview?.start_time
    ? new Date(interview.start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 px-6 py-5 bg-white flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Evaluation Form
              </h2>
              {categoryName && (
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[11px] font-bold">
                  {categoryName}
                </span>
              )}
              {round && round > 1 && (
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold">
                  Round {round}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-700 truncate">
              {candidateName ?? 'Loading...'}
            </p>
            {vacancyTitle && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {vacancyTitle}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {interviewDate !== 'N/A' && (
                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <span className="material-symbols-outlined text-[13px]">
                    calendar_today
                  </span>
                  {interviewDate}
                  {interviewTime && ` · ${interviewTime}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-3"
            type="button"
            aria-label="Close evaluation form"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">
                Loading evaluation form...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">
                error
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        {!loading && !error && template && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Existing evaluation notice — shown at top so user sees it before editing */}
            {existingEvaluation && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-sm text-amber-800 font-medium">
                  You have already submitted an evaluation. You may update it
                  until the final selection is made.
                </p>
              </div>
            )}

            {/* Template Info */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200/60 rounded-xl">
              <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wide">
                Evaluation Template
              </p>
              <p className="text-sm font-bold text-indigo-900 mt-1">
                {template.name}
              </p>
            </div>

            {/* Scoring Section */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-4">
                Criterion Scores
              </h3>
              <div className="space-y-4">
                {criteria.map((criterion, index) => (
                  <div
                    key={`${criterion.order}-${criterion.name}`}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800">
                            {criterion.name}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {criterion.weight}% weight
                          </span>
                        </div>
                      </div>
                    </div>

                  {/* Score Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>1</span>
                        <span className="font-bold text-indigo-600 text-sm">
                          {criterion.score}
                          <span className="text-slate-400 font-normal text-xs">
                            /{criterion.max_score}
                          </span>
                        </span>
                        <span>{criterion.max_score}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={criterion.max_score}
                          value={criterion.score}
                          onChange={(e) =>
                            handleScoreChange(index, Number(e.target.value))
                          }
                          disabled={submitting}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <input
                          type="number"
                          min={1}
                          max={criterion.max_score}
                          value={criterion.score}
                          onChange={(e) =>
                            handleScoreChange(index, Number(e.target.value))
                          }
                          disabled={submitting}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weighted Score Preview */}
            <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Weighted Overall Score
              </p>
              <p className="text-2xl font-extrabold text-indigo-600">
                {weightedScore.toFixed(2)}
              </p>
            </div>

            {/* Overall Comment */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                Overall Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your observations about the candidate's performance, strengths, and areas for improvement..."
                disabled={submitting}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                Recommendation
              </label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="STRONGLY_RECOMMEND">Strongly Recommend</option>
                <option value="RECOMMEND">Recommend</option>
                <option value="HOLD">Hold</option>
                <option value="DO_NOT_RECOMMEND">Do Not Recommend</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Submitting...
                  </>
                ) : existingEvaluation ? (
                  'Update Evaluation'
                ) : (
                  'Submit Evaluation'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EvaluationSubmissionForm;
