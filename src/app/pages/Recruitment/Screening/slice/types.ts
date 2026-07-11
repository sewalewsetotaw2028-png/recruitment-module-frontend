import type { ScreeningApplicationRecord } from '../api';

export interface ScreeningState {
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  applications: ScreeningApplicationRecord[];
  actionSuccess: string | null;
  actionError: string | null;
}
