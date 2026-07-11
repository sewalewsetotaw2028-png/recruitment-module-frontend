import type {
  Application,
  Candidate,
  CandidateCertification,
  CandidateDocument,
  CandidateEducation,
  CandidateExperience,
  Interview,
  JobOffer,
  JobPosting,
  JobTemplate,
  OfferActivity,
  OfferFormPayload,
  OfferTemplate,
  PostingVisibility,
  QuestionBankItem,
  RecruitmentRequest,
  RecruitmentRequestFormPayload,
  ScreeningRule,
  TalentPoolEntry,
  User,
  Vacancy,
  VacancyStatus,
  WorkforcePlan,
} from '@/types';
import type { JobDescriptionForm } from '@/pages/Recruitment/Vacancies/components/job-posting/JobDescriptionEditor';
export type UserRole =
  | 'candidate'
  | 'hr'
  | 'recruiter'
  | 'hr_admin'
  | 'ceo'
  | 'hiring_manager'
  | 'department_manager'
  | 'interviewer'
  | 'applicant';
export type VacancyHubView =
  | 'list'
  | 'editor'
  | 'preview'
  | 'posting'
  | 'detail';

export interface AppContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: User;
  users: User[];
  departments: Array<{ id: string; name: string }>;
  candidates: Candidate[];
  vacancies: Vacancy[];
  applications: Application[];
  recruitmentRequests: RecruitmentRequest[];
  workforcePlans: WorkforcePlan[];
  interviews: Interview[];
  questionBank: QuestionBankItem[];
  screeningRules: ScreeningRule[];
  jobTemplates: JobTemplate[];
  jobPostings: JobPosting[];
  jobOffers: JobOffer[];
  offerTemplates: OfferTemplate[];
  talentPool: TalentPoolEntry[];
  hrisIntegrationAvailable: boolean;
  usingMockData: boolean;
  setMockMode: (useMock: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  planningViewIntent: 'create' | { edit: string } | null;
  setPlanningViewIntent: (intent: 'create' | { edit: string } | null) => void;
  requestViewIntent: 'create' | { edit: string } | null;
  setRequestViewIntent: (intent: 'create' | { edit: string } | null) => void;
  vacancyHubView: VacancyHubView;
  setVacancyHubView: (view: VacancyHubView) => void;
  selectedVacancyId: string | null;
  setSelectedVacancyId: (id: string | null) => void;
  savedJobIds: string[];
  toggleSaveJob: (vacancyId: string) => void;
  getPublicVacancies: () => Vacancy[];
  getInternalVacancies: () => Vacancy[];
  recordPostingView: (vacancyId: string) => void;

  // State Mutators
  applyToJob: (
    vacancyId: string,
    coverLetter: string,
    selectedDocIds: string[],
  ) => void;
  createVacancyFromApprovedRequest: (requestId: string) => string | null;
  createVacancyFromRequest: (
    requestId: string,
    salaryMin: number,
    salaryMax: number,
    description: string,
    responsibilities: string,
    requirements: string,
    channels?: string[],
  ) => void;
  createVacancyDraftFromRequest: (requestId: string) => string | null;
  createVacancyDraft: (payload?: Partial<Vacancy>) => string | null;
  updateVacancyJobContent: (
    vacancyId: string,
    form: JobDescriptionForm,
  ) => void;
  saveJobTemplate: (form: JobDescriptionForm, name: string) => void | Promise<void>;
  applyJobTemplateToVacancy: (vacancyId: string, templateId: string) => void;
  ensureJobPosting: (vacancyId: string) => JobPosting;
  updateJobPostingChannels: (postingId: string, enabledSlugs: string[]) => void;
  updateJobPostingVisibility: (
    postingId: string,
    visibility: PostingVisibility,
  ) => void;
  updateJobPostingClosingDate: (postingId: string, date: string) => void;
  publishJobPosting: (postingId: string) => void;
  scheduleJobPosting: (postingId: string, date: string, time: string) => void;
  withdrawJobPosting: (postingId: string) => void;
  unpublishJobPosting: (postingId: string) => void;
  duplicateJobPosting: (postingId: string) => void;
  saveJobPostingDraft: (postingId: string) => void;
  submitJobPostingForApproval: (postingId: string) => void;
  approveJobPosting: (postingId: string, notes?: string) => void;
  rejectJobPosting: (postingId: string, rejectionReason: string) => void;
  setVacancyOnHold: (vacancyId: string) => void;
  transitionVacancyStatus: (
    vacancyId: string,
    toStatus: VacancyStatus,
    notes?: string,
  ) => void;
  updateVacancyMeta: (
    vacancyId: string,
    updates: Partial<
      Pick<Vacancy, 'closingDate' | 'openPositions' | 'location' | 'isUrgent'>
    >,
  ) => void;
  addVacancyNote: (vacancyId: string, body: string) => void;
  shortlistApplication: (
    applicationId: string,
    screeningNotes?: string,
  ) => void;
  rescheduleInterview: (
    interviewId: string,
    scheduledStart: string,
    scheduledEnd: string,
    interviewType: 'physical' | 'virtual' | 'hybrid',
  ) => void;
  transferToHris: (applicationId: string) => void;
  createOfferFromApplication: (payload: OfferFormPayload) => string | null;
  updateOffer: (offerId: string, updates: Partial<JobOffer>) => void;
  sendOffer: (offerId: string) => void;
  withdrawOffer: (offerId: string) => void;
  reviseOffer: (offerId: string) => void;
  submitOfferForApproval: (offerId: string) => void;
  approveJobOffer: (offerId: string) => void;
  acceptJobOffer: (offerId: string) => void;
  syncOfferToHris: (offerId: string) => void;
  initiateOnboarding: (offerId: string) => void;
  setHrisManualMode: (enabled: boolean) => void;
  assignTalentToVacancy: (
    talentEntryId: string,
    vacancyId: string,
  ) => string | undefined;
  inviteTalentToInterview: (talentEntryId: string, vacancyId: string) => void;
  scheduleInterview: (
    applicationId: string,
    interviewType: 'physical' | 'virtual' | 'hybrid',
    scheduledStart: string,
    scheduledEnd: string,
    location: string,
    panelIds: string[],
    questions: string[],
    options?: {
      round?: number;
      parentInterviewId?: string;
      meetingLink?: string;
      segments?: {
        segmentType: 'physical' | 'virtual';
        start: string;
        end: string;
        location?: string;
        meetingLink?: string;
      }[];
    },
  ) => void;
  submitInterviewEvaluation: (
    interviewId: string,
    overallScore: number,
    recommendation: 'pass' | 'fail' | 'hold',
    comments: string,
    criteriaScores: any[],
  ) => void;
  moveToTalentRoster: (
    applicationId: string,
    comments: string,
    options?: {
      addToPool?: boolean;
      rejectionReason?: string;
      tags?: string[];
      futureFitLabels?: string[];
    },
  ) => void;
  // Candidate document helpers removed; handled by candidate profile slice/sagas
  completeOnboarding: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    linkedinUrl: string;
    summary: string;
    expectedSalary: number;
    noticePeriod: number;
    skills: string[];
    education: CandidateEducation[];
    experience: CandidateExperience[];
    certifications: CandidateCertification[];
  }) => void;
  rejectOfferApplication: (applicationId: string) => void;
  deleteJobTemplate: (templateId: string) => void;
}
