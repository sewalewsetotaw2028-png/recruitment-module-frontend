import type { WorkforcePlanFormPayload } from '@/types';

export interface WorkforcePlanningCreateState {
  loading: boolean;
  error: string | null;
  departments: Array<{ id: string; name: string }>;
  success: boolean;
  lastCreatedPlanId: string | null;
  createStatus: 'idle' | 'draft' | 'submitted';
  currentPlanPayload: WorkforcePlanFormPayload | null;
}
