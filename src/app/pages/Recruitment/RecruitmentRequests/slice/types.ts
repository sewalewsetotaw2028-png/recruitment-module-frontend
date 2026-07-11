import type { RecruitmentRequest } from '@/types';

export interface RecruitmentRequestsState {
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  requests: RecruitmentRequest[];
  departments: Array<{ id: string; name: string }>;
  lastCreatedRequestId: string | null;
}
