export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface User {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleSlug:
    | 'hr_admin'
    | 'recruiter'
    | 'ceo'
    | 'hiring_manager'
    | 'department_manager'
    | 'interviewer'
    | 'applicant';
  roleName: string;
  avatarUrl?: string;
  departmentId?: string;
  departmentName?: string;
}

export type WorkforcePlanStatus =
  | 'draft'
  | 'submitted'
  | 'under_hr_review'
  | 'under_ceo_review'
  /**
   * Legacy alias kept for backward compatibility with earlier UI / API mapping.
   * Prefer `under_ceo_review`.
   */
  | 'pending_ceo'
  | 'approved'
  | 'rejected'
  | 'returned_for_revision'
  | 'closed';

export interface WorkforcePlanRevision {
  version: string;
  versionNumber: number;
  date: string;
  author: string;
  role: string;
  changes: string;
  status: string;
}

export interface WorkforcePlanApprovalHistory {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorName: string;
  comments?: string | null;
  createdAt: string;
}

export interface WorkforcePlanActivity {
  id: string;
  workforcePlanId: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface WorkforcePlan {
  id: string;
  organizationId: string;
  title: string;
  departmentId?: string;
  departmentName: string;
  businessUnit: string;
  planningPeriod: string;
  planningType: 'annual' | 'quarterly';
  quarter?: string;
  startDate: string;
  endDate: string;
  justificationType: string;
  justification: string;
  supportingDocumentName?: string;
  status: WorkforcePlanStatus;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  lastAutosaveAt?: string;
  hrReviewedBy?: string;
  hrReviewedByName?: string;
  hrReviewDate?: string;
  hrReviewNotes?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvalDate?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  returnedComments?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnedByName?: string;
  versionNumber: number;
  revisions: WorkforcePlanRevision[];
  approvalHistories?: WorkforcePlanApprovalHistory[];
  activities?: WorkforcePlanActivity[];
  items: WorkforcePlanItem[];
}

export interface WorkforcePlanItem {
  id: string;
  workforcePlanId: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  grade?: string;
  priority?: 'High' | 'Medium' | 'Low';
  headcountRequired: number;
  plannedStartDate: string;
  justification: string;
  jobGrade?: string;
  salaryBudget?: number;
  positionType?: 'new' | 'replacement';
  replacementEmployeeRef?: string;
  expectedImpact?: string;
  requiredQualifications?: string;
  remarks?: string;
}

export interface WorkforcePlanFormPayload {
  title: string;
  departmentName: string;
  businessUnit: string;
  planningPeriod: string;
  planningType: 'annual' | 'quarterly';
  quarter?: string;
  startDate: string;
  endDate: string;
  justificationType: string;
  justification: string;
  supportingDocumentName?: string;
  items: WorkforcePlanLineInput[];
}

export interface WorkforcePlanLineInput {
  jobTitle: string;
  departmentId?: string;
  departmentName: string;
  employmentType: WorkforcePlanItem['employmentType'];
  grade?: string;
  priority?: 'High' | 'Medium' | 'Low';
  headcountRequired: number;
  plannedStartDate: string;
  justification?: string;
  jobGrade?: string;
  salaryBudget?: number;
  positionType?: 'new' | 'replacement';
  replacementEmployeeRef?: string;
  expectedImpact?: string;
  requiredQualifications?: string;
  remarks?: string;
}

export type RecruitmentRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_ceo'
  | 'approved'
  | 'rejected'
  | 'closed';

export interface RecruitmentRequestRevision {
  version: string;
  date: string;
  author: string;
  role: string;
  changes: string;
  status: string;
}

export interface RecruitmentRequestActivity {
  id: string;
  recruitmentRequestId: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RecruitmentRequest {
  id: string;
  organizationId: string;
  referenceCode: string;
  workforcePlanId?: string;
  workforcePlanItemId?: string;
  workforcePlanReference?: string;
  requestTitle: string;
  requestedBy: string;
  requestedByName: string;
  hiringManagerId: string;
  hiringManagerName: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  grade: string;
  priority?: 'High' | 'Medium' | 'Low';
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  numberOfOpenings: number;
  location: string;
  requestType: 'planned' | 'unplanned';
  isReplacement: boolean;
  replacementForEmployee?: string;
  replacementEmployeeId?: string;
  replacementReason?: string;
  exitDate?: string;
  justificationReasonCategory?: string;
  justification: string;
  supportingDocumentName?: string;
  supportingDocumentUrl?: string;
  jobDescription: string;
  requiredSkills: string[];
  experienceYears: number;
  salaryMin?: number;
  salaryMax?: number;
  reportingManager?: string;
  jobTemplateId?: string;
  status: RecruitmentRequestStatus;
  hrReviewedBy?: string;
  hrReviewedByName?: string;
  hrReviewDate?: string;
  hrReviewNotes?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  linkedVacancyId?: string;
  customFieldValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  revisions: RecruitmentRequestRevision[];
  activities?: RecruitmentRequestActivity[];
}

export interface RecruitmentRequestFormPayload {
  requestTitle: string;
  hiringManagerId: string;
  departmentId: string;
  departmentName: string;
  jobTitle?: string;
  grade?: string;
  priority?: 'High' | 'Medium' | 'Low';
  employmentType?: 'full_time' | 'part_time' | 'contractor' | 'internship';
  numberOfOpenings?: number;
  location?: string;
  requestType: 'planned' | 'unplanned';
  workforcePlanId?: string;
  workforcePlanItemId?: string;
  isReplacement: boolean;
  replacementEmployeeId?: string;
  replacementReason?: string;
  justification: string;
  supportingDocumentName?: string;
  customFieldValues?: Record<string, string>;
}

export type VacancyStatus =
  | 'draft'
  | 'pending_approval'
  | 'open'
  | 'published'
  | 'in_progress'
  | 'on_hold'
  | 'filled'
  | 'cancelled'
  | 'closed'
  | 'withdrawn'
  | 'expired';

export type PublicationStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'withdrawn'
  | 'expired'
  | 'closed';

export type PostingVisibility = 'internal_only' | 'external_only' | 'both';

export type ChannelSyncStatus = 'active' | 'pending' | 'not_linked' | 'error';

export interface VacancyStatusHistory {
  id: string;
  vacancyId: string;
  fromStatus?: VacancyStatus;
  toStatus: VacancyStatus;
  actorId: string;
  actorName: string;
  notes?: string;
  timestamp: string;
}

export interface VacancyNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Vacancy {
  id: string;
  displayCode: string;
  organizationId: string;
  recruitmentRequestId: string;
  recruitmentRequestReference?: string;
  workforcePlanId?: string;
  workforcePlanReference?: string;
  jobTemplateId?: string;
  title: string;
  departmentId: string;
  departmentName: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  vacancyStatus: VacancyStatus;
  openPositions: number;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  benefits?: string;
  employmentTerms?: string;
  experienceRequired?: string;
  closingDate: string;
  hiringManagerId: string;
  hiringManagerName: string;
  ownerId: string;
  ownerName: string;
  isUrgent?: boolean;
  createdBy: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  publishedAt?: string;
  filledAt?: string;
  createdAt: string;
  updatedAt: string;
  channels: string[];
  activities: VacancyActivity[];
  statusHistory: VacancyStatusHistory[];
  notes: VacancyNote[];
}

/** FR-17 — Reusable job description templates (job_templates) */
export interface JobTemplate {
  id: string;
  organizationId: string;
  name: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  skills: string[];
  benefits?: string;
  employmentTerms?: string;
  experienceRequired?: string;
  departmentName?: string;
  roleTier?: 'premium' | 'core' | 'standard';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** FR-19 — Registered posting channels (posting_channels) */
export interface PostingChannel {
  id: string;
  name: string;
  slug: string;
  description: string;
  supportsInternal: boolean;
  supportsExternal: boolean;
}

/** FR-19 — Channel sync state per posting (job_posting_channels) */
export interface JobPostingChannelState {
  channelSlug: string;
  enabled: boolean;
  syncStatus: ChannelSyncStatus;
  lastSyncAt?: string;
  externalUrl?: string;
}

/** FR-18–FR-21 — Job postings (job_postings) */
export interface JobPosting {
  id: string;
  organizationId: string;
  vacancyId: string;
  postingTitle: string;
  postingDescription: string;
  publicationStatus: PublicationStatus;
  visibility: PostingVisibility;
  internalPosting: boolean;
  externalPosting: boolean;
  publishDate?: string;
  scheduledPublishDate?: string;
  expiryDate?: string;
  closingDate?: string;
  channels: JobPostingChannelState[];
  views: number;
  applicationsCount: number;
  requiresHrApproval: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  publicationHistory: PublicationHistoryEntry[];
}

export interface PublicationHistoryEntry {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
}

export interface VacancyActivity {
  id: string;
  vacancyId: string;
  actorId: string;
  actorName: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Candidate {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  country?: string;
  city?: string;
  currentPosition?: string;
  yearsOfExperience?: number;
  profileCompletionPercentage: number;
  onboardingCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  profile?: CandidateProfile;
  education: CandidateEducation[];
  experience: CandidateExperience[];
  skills: CandidateSkill[];
  certifications: CandidateCertification[];
  documents: CandidateDocument[];
}

export interface CandidateProfile {
  id: string;
  candidateId: string;
  summary?: string;
  skillsText?: string;
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriod?: number; // in days
  preferredLocation?: string;
  resumeUrl?: string;
  profilePhotoUrl?: string;
}

export interface CandidateEducation {
  id: string;
  candidateId: string;
  institution: string;
  fieldOfStudy: string;
  degree: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  yearOfGraduation?: number;
  attachmentIds?: string[];
}

export interface CandidateExperience {
  id: string;
  candidateId: string;
  companyName: string;
  jobTitle: string;
  employmentType?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  responsibilities?: string;
  attachmentIds?: string[];
  totalMonths?: number;
}

export interface CandidateSkill {
  id: string;
  candidateId: string;
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

export interface CandidateCertification {
  id: string;
  candidateId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  position?: string;
  description?: string;
  skills?: string;
  credentialUrl?: string;
  attachmentIds?: string[];
}

export interface CandidateDocument {
  id: string;
  candidateId: string;
  documentName: string;
  documentType:
    | 'resume'
    | 'cover_letter'
    | 'certificate'
    | 'academic_transcript'
    | 'other';
  fileUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface Application {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  vacancyId: string;
  vacancyTitle: string;
  applicationSource: string; // e.g. "LinkedIn", "Telegram", "Employee Referral"
  applicationStatus:
    | 'submitted'
    | 'screening'
    | 'shortlisted'
    | 'interview'
    | 'offered'
    | 'hired'
    | 'rejected'
    | 'withdrawn';
  currentStage: string; // e.g. "Screening", "Technical Round 1", "Panel Interview", "Offer Stage"
  coverLetter?: string;
  submittedAt: string;
  matchScore: number; // calculated percentage
  screeningComments?: string;
  rejectionReason?: string;
  evaluationScore?: number;
}

export interface ScreeningRule {
  id: string;
  organizationId: string;
  name: string;
  vacancyId?: string; // null if global
  minimumExperience: number;
  minimumEducation: string;
  requiredSkills: string[];
}

export interface Interview {
  id: string;
  organizationId: string;
  applicationId: string;
  candidateName: string;
  vacancyTitle: string;
  interviewRound: number; // 1, 2, etc.
  parentInterviewId?: string;
  interviewType: 'physical' | 'virtual' | 'hybrid';
  scheduledStart: string;
  scheduledEnd: string;
  location?: string;
  meetingLink?: string;
  interviewStatus: 'scheduled' | 'rescheduled' | 'completed' | 'evaluation_pending' | 'finalized' | 'cancelled';
  panelMembers: { userId: string; userName: string; roleSlug: string }[];
  questions?: string[];
  evaluations?: InterviewEvaluation[];
  hybridSegments?: {
    segmentType: 'physical' | 'virtual';
    start: string;
    end: string;
    location?: string;
    meetingLink?: string;
  }[];
}

export interface InterviewEvaluation {
  id: string;
  interviewId: string;
  evaluatorId: string;
  evaluatorName: string;
  overallScore: number; // 1 to 5 or 1 to 100
  recommendation: 'pass' | 'fail' | 'hold';
  comments: string;
  submittedAt: string;
  criteriaScores: {
    criteriaName: string;
    score: number;
    maxScore: number;
    comments?: string;
  }[];
}

export interface QuestionBankItem {
  id: string;
  organizationId: string;
  questionText: string;
  jobRole: string;
  grade: string; // e.g., "Senior", "Officer", "Manager"
  functionalArea: string; // e.g., "Credit", "IT", "Wealth"
  category: string; // e.g., "Technical", "Behavioral", "Culture"
}

/** Offer Management & HRIS Integration (FR-45+) */
export type OfferStatus =
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

export type HrisSyncStatus =
  | 'not_connected'
  | 'pending'
  | 'synced'
  | 'failed'
  | 'manual_mode';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface OfferActivity {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface JobOffer {
  id: string;
  displayCode: string;
  organizationId: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  vacancyId: string;
  positionTitle: string;
  departmentName: string;
  salary: number;
  salaryCurrency: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  startDate: string;
  benefits?: string;
  expirationDate: string;
  status: OfferStatus;
  templateId?: string;
  hrisSyncStatus: HrisSyncStatus;
  hrisEmployeeId?: string;
  hrisLastSyncAt?: string;
  onboardingStatus: OnboardingStatus;
  manualOnboarding: boolean;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  sentAt?: string;
  acceptedAt?: string;
  activities: OfferActivity[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferTemplate {
  id: string;
  organizationId: string;
  name: string;
  defaultBenefits: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  salaryBandMin?: number;
  salaryBandMax?: number;
}

export interface OfferFormPayload {
  applicationId: string;
  salary: number;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'internship';
  startDate: string;
  benefits?: string;
  expirationDate: string;
  templateId?: string;
}

/** Talent Roster / Pool (FR-50+) */
export type TalentAvailability = 'available' | 'employed' | 'passive';
export type TalentTier = 'high_potential' | 'standard' | 'developing';

export interface TalentHistoryEntry {
  id: string;
  year: number;
  vacancyTitle: string;
  departmentName?: string;
  outcome: string;
  interviewScore?: number;
  feedback?: string;
  rejectionReason?: string;
}

export interface TalentPoolEntry {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  email: string;
  currentPosition?: string;
  sourceApplicationId?: string;
  tags: string[];
  tier: TalentTier;
  availability: TalentAvailability;
  rejectionReason?: string;
  futureFitLabels: string[];
  skills: string[];
  yearsOfExperience: number;
  educationSummary?: string;
  lastInterviewScore?: number;
  departmentInterest?: string;
  addedAt: string;
  addedByName: string;
  history: TalentHistoryEntry[];
}

// Pagination & API types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
