import type { Application } from '@/types';

export interface KanbanState {
  loading: boolean;
  error: string | null;
  applications: Application[];
}
