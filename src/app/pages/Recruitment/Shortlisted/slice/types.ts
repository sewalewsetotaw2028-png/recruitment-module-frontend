import type { ScreeningApplicationRecord } from '../../Screening/api';

export interface ShortlistedState {
  loading: boolean;
  error: string | null;
  applications: ScreeningApplicationRecord[];
}
