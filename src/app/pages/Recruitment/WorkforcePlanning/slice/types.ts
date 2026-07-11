import type { WorkforcePlan } from '@/types';

export interface WorkforcePlanningState {
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  workforcePlans: WorkforcePlan[];
  departments: Array<{ id: string; name: string }>;
}
