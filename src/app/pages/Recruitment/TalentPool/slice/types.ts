import type { TalentPoolEntry } from '@/types';

export interface TalentPoolState {
  loading: boolean;
  error: string | null;
  entries: TalentPoolEntry[];
  linking: boolean;
  history: any;
  historyLoading: boolean;
  lastLinkedRosterId: string | null;
  interviewScheduling: boolean;
  interviewSuccess: string | null;
  interviewError: string | null;
}
