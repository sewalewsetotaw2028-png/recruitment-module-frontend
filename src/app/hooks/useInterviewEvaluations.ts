import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const INTERVIEW_EVALUATION_ROUTES = {
  interviewById: (id: string) => `${API_V1}/interviews/${id}`,
  evaluationSummary: (id: string) => `${API_V1}/interviews/${id}/evaluations`,
  vacancyEvaluationSummary: (id: string) =>
    `${API_V1}/vacancies/${id}/evaluation-summary`,
  selectCandidate: (id: string) => `${API_V1}/vacancies/${id}/select-candidate`,
  revokeSelection: (id: string) => `${API_V1}/vacancies/${id}/selection`,
  submitEvaluation: (id: string) => `${API_V1}/interviews/${id}/evaluations`,
  updateEvaluation: (interviewId: string, evaluationId: string) =>
    `${API_V1}/interviews/${interviewId}/evaluations/${evaluationId}`,
  pendingEvaluations: `${API_V1}/my/pending-evaluations`,
  hiringMinutes: `${API_V1}/hiring-minutes`,
  hiringMinuteById: (id: string) => `${API_V1}/hiring-minutes/${id}`,
  approveHiringMinute: (id: string) => `${API_V1}/hiring-minutes/${id}/approve`,
  applicationEvaluations: (applicationId: string) =>
    `${API_V1}/interviews/applications/${applicationId}/evaluations`,
  rejectHiringMinute: (id: string) => `${API_V1}/hiring-minutes/${id}/reject`,
  addSignatory: (id: string) => `${API_V1}/hiring-minutes/${id}/signatures`,
  addToRoster: (id: string) => `${API_V1}/hiring-minutes/${id}/add-to-roster`,
  sendRegrets: (id: string) => `${API_V1}/hiring-minutes/${id}/send-regrets`,
};

export interface EvaluationScore {
  criterion_id?: string;
  name?: string;
  score: number;
}

export interface InterviewEvaluation {
  id: string;
  interview_id: string;
  evaluator_id: string;
  evaluator_name?: string;
  overall_score: number;
  scores_json: Record<string, unknown>;
  comments?: string;
  recommendation: string;
  created_at?: string;
  submitted_at?: string;
}

export interface Interview {
  id: string;
  status: string;
  application_id: string;
  interview_category_id?: string;
  interview_category?: {
    id: string;
    name: string;
  };
  round?: number;
  mode?: string;
  start_time?: string;
  end_time?: string;
  application?: {
    id: string;
    candidate?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    vacancy?: {
      id: string;
      title: string;
    };
  };
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  interview_category_id: string | null;
  criteria: Array<{
    name: string;
    weight: number;
    max_score: number;
    order: number;
  }>;
}

export interface SubmitEvaluationPayload {
  scores: Array<{
    criterion_id?: string;
    name?: string;
    score: number;
  }>;
  comments: string;
  recommendation: string;
}

export interface PendingEvaluation {
  interview_id: string;
  vacancy_title: string;
  candidate_name: string;
  interview_date: string;
  category_name?: string;
}

export interface HiringMinutePanelMember {
  user_id: string;
  member_name: string;
  position_role: string;
}

export interface HiringMinuteSignatory {
  user_id?: string;
  role: string;
  signatory_name: string;
  signed_at: string;
}

export interface RejectedCandidate {
  application_id: string;
  candidate_id?: string;
  candidate_name: string;
  candidate_email?: string;
  rejection_reason?: string | null;
  regret_sent_at?: string | null;
  roster_added: boolean;
}

export interface SelectedCandidateSummary {
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email?: string;
  application_status: string;
  aggregate_score: number | null;
  expected_salary: number | null;
  selected_at?: string;
}

export interface HiringMinute {
  id: string;
  vacancy_id: string;
  selected_candidate_id: string | null;
  selected_candidate_name?: string;
  selected_candidate_score: number | null;
  alternative_candidate_id?: string;
  alternative_candidate_name?: string;
  alternative_candidate_score?: number | null;
  reason_for_selection: string;
  reason_for_alternative?: string;
  expected_salary: number | null;
  expected_joining_date?: string;
  panel_recommendation: string;
  final_decision:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'RETURNED_FOR_FURTHER_REVIEW';
  approved_by_id?: string;
  approved_at?: string;
  prepared_by_id?: string;
  prepared_by_name?: string;
  approved_by_name?: string;
  panel_members?: HiringMinutePanelMember[];
  signatories?: HiringMinuteSignatory[];
  rejected_candidates?: RejectedCandidate[];
  selected_candidates?: SelectedCandidateSummary[];
  current_selected_count?: number;
  remaining_openings?: number;
  has_remaining_openings?: boolean;
  vacancy?: {
    title: string;
    department: string;
    business_unit: string;
    employment_type: string;
    open_positions: number;
  };
  interview_dates?: string;
  total_applications?: number;
  total_screened?: number;
  total_shortlisted?: number;
  total_interviewed?: number;
}

export interface CandidateRanking {
  application_id: string;
  candidate_name: string;
  candidate_id: string;
  aggregate_score: number;
  category_breakdown: Record<string, number>;
  panel_recommendations: Record<string, number>;
  application_status: string;
  evaluation_count: number;
  total_evaluators: number;
}

export interface VacancyEvaluationSummary {
  rankings: CandidateRanking[];
  completeness: {
    fully_evaluated: number;
    total: number;
  };
}

export interface CandidateEvaluationDetail {
  interview_id: string;
  interview_category: string;
  interview_date: string;
  evaluator_name: string;
  evaluator_email: string;
  overall_score: number;
  recommendation: string;
  scores_json: Array<{
    criterion_name: string;
    score: number;
    weight: number;
    weighted_score: number;
  }>;
  comments?: string;
  created_at: string;
}

const parseNumericValue = (value: unknown): number | undefined => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === 'object') {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const extractDisplayValue = (value: unknown): string | undefined => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred =
      record.name ?? record.title ?? record.label ?? record.value;
    if (typeof preferred === 'string' || typeof preferred === 'number') {
      return String(preferred);
    }
  }
  return undefined;
};

const normalizeHiringMinute = (raw: HiringMinute): HiringMinute => ({
  ...raw,
  selected_candidate_score:
    parseNumericValue(raw.selected_candidate_score) ?? null,
  expected_salary: parseNumericValue(raw.expected_salary) ?? null,
  alternative_candidate_score:
    parseNumericValue(raw.alternative_candidate_score) ?? null,
  selected_candidates: raw.selected_candidates?.map((candidate) => ({
    ...candidate,
    aggregate_score: parseNumericValue(candidate.aggregate_score) ?? null,
    expected_salary: parseNumericValue(candidate.expected_salary) ?? null,
  })),
  current_selected_count: parseNumericValue(raw.current_selected_count) ?? 0,
  remaining_openings: parseNumericValue(raw.remaining_openings) ?? 0,
  has_remaining_openings: Boolean(raw.has_remaining_openings),
  vacancy: raw.vacancy
    ? {
        ...raw.vacancy,
        title: extractDisplayValue(raw.vacancy.title) ?? '',
        department: extractDisplayValue(raw.vacancy.department) ?? '',
        business_unit: extractDisplayValue(raw.vacancy.business_unit) ?? '',
        employment_type: extractDisplayValue(raw.vacancy.employment_type) ?? '',
        open_positions: parseNumericValue(raw.vacancy.open_positions) ?? 0,
      }
    : undefined,
});

export async function fetchInterviewById(
  interviewId: string,
): Promise<Interview> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.interviewById(interviewId),
  );
  return res.data as Interview;
}

export async function fetchEvaluationSummary(
  interviewId: string,
): Promise<InterviewEvaluation[]> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.evaluationSummary(interviewId),
  );
  return res.data as InterviewEvaluation[];
}

export async function submitEvaluation(
  interviewId: string,
  payload: SubmitEvaluationPayload,
): Promise<InterviewEvaluation> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.submitEvaluation(interviewId),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data as InterviewEvaluation;
}

export async function updateEvaluation(
  interviewId: string,
  evaluationId: string,
  payload: Partial<SubmitEvaluationPayload>,
): Promise<InterviewEvaluation> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.updateEvaluation(interviewId, evaluationId),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return res.data as InterviewEvaluation;
}

export async function fetchPendingEvaluations(): Promise<PendingEvaluation[]> {
  const res = await apiFetch(INTERVIEW_EVALUATION_ROUTES.pendingEvaluations);
  return res.data as PendingEvaluation[];
}

export async function fetchVacancyEvaluationSummary(
  vacancyId: string,
): Promise<VacancyEvaluationSummary> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.vacancyEvaluationSummary(vacancyId),
  );
  return res.data as VacancyEvaluationSummary;
}

export async function fetchCandidateEvaluations(
  applicationId: string,
): Promise<CandidateEvaluationDetail[]> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.applicationEvaluations(applicationId),
  );
  return res.data as CandidateEvaluationDetail[];
}

export async function fetchHiringMinuteById(id: string): Promise<HiringMinute> {
  const res = await apiFetch(INTERVIEW_EVALUATION_ROUTES.hiringMinuteById(id));
  return normalizeHiringMinute(res.data as HiringMinute);
}

export async function fetchHiringMinuteByVacancy(
  vacancyId: string,
): Promise<HiringMinute | null> {
  const res = await apiFetch(
    `${API_V1}/hiring-minutes?vacancy_id=${encodeURIComponent(vacancyId)}`,
  );
  const data = res.data as HiringMinute | HiringMinute[] | null;
  if (!data) return null;
  const minute = Array.isArray(data)
    ? data.length > 0
      ? data[0]
      : null
    : data;
  return minute ? normalizeHiringMinute(minute) : null;
}

export async function selectCandidate(
  vacancyId: string,
  payload: {
    selected_application_id: string;
    alternative_application_id?: string;
    reason_for_selection: string;
    reason_for_alternative?: string;
    expected_salary: number;
    expected_joining_date?: string;
  },
): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.selectCandidate(vacancyId),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function revokeSelection(vacancyId: string): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.revokeSelection(vacancyId),
    {
      method: 'DELETE',
    },
  );
  return res.data;
}

export async function approveHiringMinute(
  hiringMinuteId: string,
): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.approveHiringMinute(hiringMinuteId),
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
  return res.data;
}

export async function rejectHiringMinute(
  hiringMinuteId: string,
  comments: string,
): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.rejectHiringMinute(hiringMinuteId),
    {
      method: 'POST',
      body: JSON.stringify({ comments }),
    },
  );
  return res.data;
}

export async function addSignatory(
  hiringMinuteId: string,
  role: string,
  signatoryName: string,
): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.addSignatory(hiringMinuteId),
    {
      method: 'POST',
      body: JSON.stringify({ role, signatory_name: signatoryName }),
    },
  );
  return res.data;
}

export async function addToRoster(
  hiringMinuteId: string,
  applicationIds: string[],
): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.addToRoster(hiringMinuteId),
    {
      method: 'POST',
      body: JSON.stringify({ application_ids: applicationIds }),
    },
  );
  return res.data;
}

export async function sendRegrets(hiringMinuteId: string): Promise<any> {
  const res = await apiFetch(
    INTERVIEW_EVALUATION_ROUTES.sendRegrets(hiringMinuteId),
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
  return res.data;
}
