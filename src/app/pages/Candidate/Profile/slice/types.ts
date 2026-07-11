import type { CandidateProfileData } from '../../types';

export interface CandidateProfileState {
  loading: boolean;
  error: string | null;
  profile: CandidateProfileData | null;
  actionSuccess: string | null;
  actionError: string | null;
}

