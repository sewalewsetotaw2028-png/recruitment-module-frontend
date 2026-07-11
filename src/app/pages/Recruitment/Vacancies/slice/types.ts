import type { Vacancy } from '@/types';

export interface VacanciesState {
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  vacancies: Vacancy[];
}
