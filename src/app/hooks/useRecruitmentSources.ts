import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const RECRUITMENT_SOURCE_ROUTES = {
  sources: `${API_V1}/config/recruitment-sources`,
  sourceById: (id: string) => `${API_V1}/config/recruitment-sources/${id}`,
};

export interface RecruitmentSource {
  id: string;
  company_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecruitmentSourcePayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRecruitmentSourcePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export async function fetchRecruitmentSources(): Promise<
  RecruitmentSource[]
> {
  const res = await apiFetch(RECRUITMENT_SOURCE_ROUTES.sources);
  return res.data as RecruitmentSource[];
}

export async function createRecruitmentSource(
  payload: CreateRecruitmentSourcePayload,
): Promise<RecruitmentSource> {
  const res = await apiFetch(RECRUITMENT_SOURCE_ROUTES.sources, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as RecruitmentSource;
}

export async function updateRecruitmentSource(
  id: string,
  payload: UpdateRecruitmentSourcePayload,
): Promise<RecruitmentSource> {
  const res = await apiFetch(RECRUITMENT_SOURCE_ROUTES.sourceById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as RecruitmentSource;
}

export async function deleteRecruitmentSource(id: string): Promise<void> {
  await apiFetch(RECRUITMENT_SOURCE_ROUTES.sourceById(id), {
    method: 'DELETE',
  });
}
