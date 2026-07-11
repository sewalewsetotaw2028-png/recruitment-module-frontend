export interface RecruitmentDashboardState {
  loading: boolean;
  error: string | null;
  summary?: RecruitmentDashboardStats['summary'];
  pipeline?: RecruitmentDashboardStats['pipeline'];
  sourcing?: RecruitmentDashboardStats['sourcing'];
  kpis?: RecruitmentDashboardStats['kpis'];
  trends?: RecruitmentDashboardStats['trends'];
  lastFetchedAt?: number;
}

export interface RecruitmentDashboardPipelineItem {
  stage: string;
  count: number;
}

export interface RecruitmentDashboardSourcingItem {
  source: string;
  count: number;
}

export interface RecruitmentDashboardStats {
  summary: {
    totalVacancies: number;
    openVacancies: number;
    totalApplications: number;
    hiredCount: number;
    fulfillmentRate: string;
  };
  sourcing?: RecruitmentDashboardSourcingItem[];
  pipeline: RecruitmentDashboardPipelineItem[];
  kpis?: {
    averageTimeToFillDays?: number;
    averageTimeToHireDays?: number;
    offerAcceptanceRate?: string;
    candidateConversionRate?: string;
    interviewToSelectionRatio?: number;
    talentRosterUtilizationRate?: string;
    totals?: {
      totalOffers?: number;
      acceptedOffersCount?: number;
      totalInterviews?: number;
    };
  };
  trends?: {
    vacancies: number[];
    applications: number[];
    hires: number[];
    fulfillment: number[];
    hiredImprovement: number;
  };
}
