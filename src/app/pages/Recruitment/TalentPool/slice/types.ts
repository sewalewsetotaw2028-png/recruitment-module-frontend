import type { TalentPoolEntry } from '@/types';

export interface TalentPoolState {
  loading: boolean;
  error: string | null;
  entries: TalentPoolEntry[];
}
