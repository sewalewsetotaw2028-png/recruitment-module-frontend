import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const EVALUATION_TEMPLATE_ROUTES = {
  templates: `${API_V1}/config/evaluation-templates`,
  templateById: (id: string) => `${API_V1}/config/evaluation-templates/${id}`,
  templateCriteriaById: (id: string) =>
    `${API_V1}/config/evaluation-templates/${id}/criteria`,
};

export interface EvaluationCriteria {
  name: string;
  weight: number;
  /** Backend returns snake_case; both forms accepted here */
  max_score?: number;
  maxScore?: number;
  order: number;
}

export interface EvaluationTemplate {
  id: string;
  company_id: number;
  name: string;
  interview_category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  criteria: EvaluationCriteria[];
}

export interface CreateEvaluationTemplatePayload {
  name: string;
  interviewCategoryId?: string;
  criteria: EvaluationCriteria[];
}

export interface UpdateEvaluationTemplatePayload {
  name?: string;
  interviewCategoryId?: string;
  isActive?: boolean;
  criteria?: EvaluationCriteria[];
}

export async function fetchEvaluationTemplates(): Promise<
  EvaluationTemplate[]
> {
  const res = await apiFetch(EVALUATION_TEMPLATE_ROUTES.templates);
  return res.data as EvaluationTemplate[];
}

export async function createEvaluationTemplate(
  payload: CreateEvaluationTemplatePayload,
): Promise<EvaluationTemplate> {
  const res = await apiFetch(EVALUATION_TEMPLATE_ROUTES.templates, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as EvaluationTemplate;
}

export async function updateEvaluationTemplate(
  id: string,
  payload: UpdateEvaluationTemplatePayload,
): Promise<EvaluationTemplate> {
  const res = await apiFetch(EVALUATION_TEMPLATE_ROUTES.templateById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as EvaluationTemplate;
}

export async function replaceEvaluationTemplateCriteria(
  id: string,
  criteria: EvaluationCriteria[],
): Promise<EvaluationTemplate> {
  const res = await apiFetch(
    EVALUATION_TEMPLATE_ROUTES.templateCriteriaById(id),
    {
      method: 'PUT',
      body: JSON.stringify({ criteria }),
    },
  );
  return res.data as EvaluationTemplate;
}

export async function deleteEvaluationTemplate(id: string): Promise<void> {
  await apiFetch(EVALUATION_TEMPLATE_ROUTES.templateById(id), {
    method: 'DELETE',
  });
}
