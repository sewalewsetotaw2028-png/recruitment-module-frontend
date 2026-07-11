import type { Application } from '@/types';

type ApiRaw = Record<string, unknown>;

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : fallback;

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const normalizeApplicationStatus = (
  value: unknown,
): Application['applicationStatus'] => {
  const status = String(value ?? 'submitted').toLowerCase();
  if (status === 'under_screening') return 'screening';
  if (status === 'shortlisted') return 'shortlisted';
  if (status === 'selected') return 'interview';
  if (status === 'interview_completed') return 'interview';
  if (status === 'under_evaluation') return 'interview';
  if (status === 'offer_issued') return 'offered';
  if (status === 'offer_accepted') return 'hired';
  if (status === 'offer_declined') return 'rejected';
  if (status === 'moved_to_talent_roster') return 'withdrawn';
  return status as Application['applicationStatus'];
};

export interface ScreeningCriterionResult {
  field: string;
  operator: string;
  value: unknown;
  weight: number;
  met: boolean;
  score: number;
  actualValue?: string | number | boolean;
}

export interface ScreeningCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentPosition?: string;
  yearsOfExperience: number;
  skills: string[];
  languages: string[];
  experiences: Array<{
    id: string;
    companyName: string;
    position: string;
    startDate: string;
    endDate?: string;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear?: number;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    fileUrl: string;
  }>;
}

export interface ScreeningVacancySummary {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  departmentName: string;
}

export interface ScreeningApplicationRecord {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  vacancyId: string;
  vacancyTitle: string;
  applicationStatus: Application['applicationStatus'];
  currentStage: string;
  submittedAt: string;
  matchScore: number;
  screeningComments?: string;
  rejectionReason?: string;
  shortlistReason?: string;
  candidate: ScreeningCandidateSummary;
  vacancy: ScreeningVacancySummary;
  screeningCriteria: ScreeningCriterionResult[];
}

export function mapApiApplication(raw: ApiRaw): ScreeningApplicationRecord {
  const candidate = (raw.candidate ?? {}) as ApiRaw;
  const vacancy = (raw.vacancy ?? {}) as ApiRaw;
  const experiences = Array.isArray(candidate.experiences)
    ? candidate.experiences
    : [];
  const educations = Array.isArray(candidate.educations)
    ? candidate.educations
    : [];
  const documents = Array.isArray(candidate.documents) ? candidate.documents : [];
  const screeningCriteria = Array.isArray(raw.screening_criteria)
    ? raw.screening_criteria
    : Array.isArray(raw.screeningCriteria)
      ? raw.screeningCriteria
      : [];

  return {
    id: asString(raw.id),
    organizationId: asString(raw.company_id ?? raw.organization_id),
    candidateId: asString(raw.candidate_id ?? candidate.id),
    candidateName:
      `${asString(candidate.first_name)} ${asString(candidate.last_name)}`.trim() ||
      'Candidate',
    candidateEmail: asString(candidate.email, 'unknown@example.com'),
    vacancyId: asString(raw.vacancy_id ?? vacancy.id),
    vacancyTitle: asString(vacancy.title, 'Role'),
    applicationStatus: normalizeApplicationStatus(raw.status ?? raw.application_status),
    currentStage: asString(raw.current_stage, 'Screening'),
    submittedAt: asString(raw.submitted_at, new Date().toISOString()),
    matchScore: asNumber(raw.match_score),
    screeningComments: raw.screening_comments
      ? asString(raw.screening_comments)
      : undefined,
    rejectionReason: raw.rejection_reason
      ? asString(raw.rejection_reason)
      : undefined,
    shortlistReason: (raw.screening_log as ApiRaw)?.reason
      ? asString((raw.screening_log as ApiRaw).reason)
      : undefined,
    candidate: {
      id: asString(candidate.id),
      firstName: asString(candidate.first_name),
      lastName: asString(candidate.last_name),
      email: asString(candidate.email),
      phone: candidate.phone ? asString(candidate.phone) : undefined,
      currentPosition: candidate.current_position
        ? asString(candidate.current_position)
        : undefined,
      yearsOfExperience: asNumber(candidate.years_of_experience),
      skills: Array.isArray(candidate.skills)
        ? candidate.skills.map((skill) => asString(skill)).filter(Boolean)
        : [],
      languages: Array.isArray(candidate.languages)
        ? candidate.languages.map((language) => asString(language)).filter(Boolean)
        : [],
      experiences: experiences.map((experience) => {
        const item = experience as ApiRaw;
        return {
          id: asString(item.id),
          companyName: asString(item.company_name),
          position: asString(item.job_title ?? item.position),
          startDate: asString(item.start_date),
          endDate: item.end_date ? asString(item.end_date) : undefined,
        };
      }),
      educations: educations.map((education) => {
        const item = education as ApiRaw;
        return {
          id: asString(item.id),
          institution: asString(item.institution),
          degree: asString(item.degree),
          fieldOfStudy: asString(item.field_of_study),
          graduationYear: item.graduation_year
            ? asNumber(item.graduation_year)
            : undefined,
        };
      }),
      documents: documents.map((document) => {
        const item = document as ApiRaw;
        return {
          id: asString(item.id),
          name: asString(item.name),
          type: asString(item.type),
          fileUrl: asString(item.file_url),
        };
      }),
    },
    vacancy: {
      id: asString(vacancy.id),
      title: asString(vacancy.title),
      location: asString(vacancy.location),
      employmentType: asString(vacancy.employment_type),
      departmentName: asString(vacancy.department_name),
    },
    screeningCriteria: screeningCriteria.map((criterion) => {
      const item = criterion as ApiRaw;
      return {
        field: asString(item.field),
        operator: asString(item.operator),
        value: item.value,
        weight: asNumber(item.weight),
        met: Boolean(item.met),
        score: asNumber(item.score),
        actualValue:
          typeof item.actual_value === 'boolean' ||
          typeof item.actual_value === 'number' ||
          typeof item.actual_value === 'string'
            ? item.actual_value
            : undefined,
      };
    }),
  };
}
