import type { Vacancy } from '@/types';



export interface CandidateJobSearchState {

  loading: boolean;

  error: string | null;

  vacancies: Vacancy[];

  actionSuccess: string | null;

  actionError: string | null;

}

