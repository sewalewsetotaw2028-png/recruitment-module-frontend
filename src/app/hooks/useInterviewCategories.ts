import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const INTERVIEW_CATEGORY_ROUTES = {
  categories: `${API_V1}/config/interview-categories`,
  categoryById: (id: string) => `${API_V1}/config/interview-categories/${id}`,
};

export interface InterviewCategory {
  id: string;
  company_id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewCategoryPayload {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateInterviewCategoryPayload {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export async function fetchInterviewCategories(): Promise<
  InterviewCategory[]
> {
  const res = await apiFetch(INTERVIEW_CATEGORY_ROUTES.categories);
  return res.data as InterviewCategory[];
}

export async function createInterviewCategory(
  payload: CreateInterviewCategoryPayload,
): Promise<InterviewCategory> {
  const res = await apiFetch(INTERVIEW_CATEGORY_ROUTES.categories, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as InterviewCategory;
}

export async function updateInterviewCategory(
  id: string,
  payload: UpdateInterviewCategoryPayload,
): Promise<InterviewCategory> {
  const res = await apiFetch(INTERVIEW_CATEGORY_ROUTES.categoryById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as InterviewCategory;
}

export async function deleteInterviewCategory(id: string): Promise<void> {
  await apiFetch(INTERVIEW_CATEGORY_ROUTES.categoryById(id), {
    method: 'DELETE',
  });
}
