import type {
  Application,
  Candidate,
  Interview,
  JobOffer,
  JobPosting,
  JobTemplate,
  OfferTemplate,
  QuestionBankItem,
  RecruitmentRequest,
  ScreeningRule,
  TalentPoolEntry,
  User,
  Vacancy,
  WorkforcePlan,
} from '@/types';

export interface RecruitmentDataState {
  departments: Array<{ id: string; name: string }>;
  candidates: Candidate[];
  vacancies: Vacancy[];
  applications: Application[];
  recruitmentRequests: RecruitmentRequest[];
  workforcePlans: WorkforcePlan[];
  interviews: Interview[];
  questionBank: QuestionBankItem[];
  screeningRules: ScreeningRule[];
  users: User[];
  jobTemplates: JobTemplate[];
  jobPostings: JobPosting[];
  jobOffers: JobOffer[];
  offerTemplates: OfferTemplate[];
  talentPool: TalentPoolEntry[];
  hrisIntegrationAvailable: boolean;
  hrisManualMode: boolean;
  savedJobIds: string[];
}
