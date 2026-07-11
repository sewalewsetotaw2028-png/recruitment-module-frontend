import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const RECRUITMENT_CHANNEL_ROUTES = {
  channels: `${API_V1}/config/recruitment-channels`,
  channelById: (id: string) => `${API_V1}/config/recruitment-channels/${id}`,
};

export interface RecruitmentChannel {
  id: string;
  company_id: number;
  name: string;
  description: string | null;
  is_automated: boolean;
  api_url: string | null;
  api_username: string | null;
  api_password: string | null;
  api_token: string | null;
  is_active: boolean;
  share_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecruitmentChannelPayload {
  name: string;
  description?: string;
  isAutomated?: boolean;
  isActive?: boolean;
  apiUrl?: string;
  apiUsername?: string;
  apiToken?: string;
  shareTemplate?: string;
}

export interface UpdateRecruitmentChannelPayload {
  name?: string;
  description?: string;
  isAutomated?: boolean;
  isActive?: boolean;
  apiUrl?: string;
  apiUsername?: string;
  apiToken?: string;
  shareTemplate?: string;
}

export async function fetchRecruitmentChannels(): Promise<
  RecruitmentChannel[]
> {
  const res = await apiFetch(RECRUITMENT_CHANNEL_ROUTES.channels);
  return res.data as RecruitmentChannel[];
}

export async function createRecruitmentChannel(
  payload: CreateRecruitmentChannelPayload,
): Promise<RecruitmentChannel> {
  const res = await apiFetch(RECRUITMENT_CHANNEL_ROUTES.channels, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as RecruitmentChannel;
}

export async function updateRecruitmentChannel(
  id: string,
  payload: UpdateRecruitmentChannelPayload,
): Promise<RecruitmentChannel> {
  const res = await apiFetch(RECRUITMENT_CHANNEL_ROUTES.channelById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as RecruitmentChannel;
}

export async function deleteRecruitmentChannel(id: string): Promise<void> {
  await apiFetch(RECRUITMENT_CHANNEL_ROUTES.channelById(id), {
    method: 'DELETE',
  });
}
