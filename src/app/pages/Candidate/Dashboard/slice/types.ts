export interface CandidateDashboardApplication {
  id: string;
  vacancyTitle: string;
  location?: string;
  currentStage: string;
  appliedAt?: string;
  interviewsCount: number;
}

export interface CandidateDashboardInterview {
  id: string;
  applicationId?: string;
  vacancyTitle: string;
  scheduledStart: string;
  interviewRound?: number;
  meetingLink?: string;
  interviewStatus: string;
}

export interface CandidateDashboardOffer {
  id: string;
  status: string;
  expiry_date: string;
  application?: {
    vacancy?: {
      title: string;
      location?: string;
    };
  };
}

export interface CandidateDashboardState {
  loading: boolean;
  error: string | null;
  applications: CandidateDashboardApplication[];
  interviews: CandidateDashboardInterview[];
  offers: CandidateDashboardOffer[];
  completeness: {
    percentage: number;
    sections: { key: string; label: string; path: string; complete: boolean; optional?: boolean; count?: number }[];
    missing: { key: string; label: string; path: string; optional: boolean }[];
  } | null;
}
