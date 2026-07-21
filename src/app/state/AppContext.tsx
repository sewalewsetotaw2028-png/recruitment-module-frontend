import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/services/apiClient';
import { recruitmentService } from '@/services/recruitmentService';
// API_ROUTES not used here; page-specific sagas/apis own routes
import type {
  Candidate,
  Vacancy,
  Application,
  RecruitmentRequest,
  WorkforcePlan,
  RecruitmentRequestFormPayload,
  Interview,
  QuestionBankItem,
  ScreeningRule,
  User,
  CandidateDocument,
  JobTemplate,
  JobPosting,
  PostingVisibility,
  VacancyStatus,
  JobOffer,
  OfferTemplate,
  OfferFormPayload,
  OfferActivity,
  TalentPoolEntry,
} from '@/types';
import { POSTING_CHANNELS, defaultChannelStates } from '@/data/postingChannels';
import {
  canCreateVacancy,
  canCreateRecruitmentRequest,
} from '@/utils/permissions';
import {
  buildRevision as buildRequestRevision,
  buildWorkforcePlanReference,
  generateReferenceCode,
} from '@/utils/recruitmentRequest';
import { generateVacancyDisplayCode } from '@/utils/vacancyManagement';
import { generateOfferDisplayCode } from '@/utils/offerManagement';
import { buildTalentEntryFromRejection } from '@/utils/talentRoster';
import {
  isPostingInternallyVisible,
  isPostingPubliclyVisible,
} from '@/utils/jobPosting';
import type { JobDescriptionForm } from '@/pages/Recruitment/Vacancies/components/job-posting/JobDescriptionEditor';
import {
  ToastProvider,
  useToast,
  type ToastType,
} from '@/components/common/Toast';
import type {
  CandidateCertification,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
} from '@/types';

import type {
  AppContextType,
  UserRole,
  VacancyHubView,
} from './appContext.types';
export type { UserRole, VacancyHubView } from './appContext.types';
import {
  mapBackendApplication,
  mapBackendInterview,
  mapBackendRecruitmentRequest,
  mapBackendVacancy,
  mapBackendWorkforcePlan,
} from './appContext.mappers';
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ToastProvider>
    <AppProviderInner>{children}</AppProviderInner>
  </ToastProvider>
);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const AppProviderInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast();
  const {
    token,
    user: authUser,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const notify = (message: string, type: ToastType = 'success') =>
    toast(message, type);

  // Helper: normalize backend role string to UserRole
  const normalizeRole = (role?: string): UserRole => {
    if (!role) {
      return 'candidate';
    }
    const normalized = role.toLowerCase().replace(/[- ]/g, '_');
    switch (normalized) {
      case 'candidate':
      case 'applicant':
        return normalized as UserRole;
      case 'recruiter':
        return 'recruiter';
      case 'hr':
      case 'hr_admin':
        return 'hr_admin';
      case 'ceo':
        return 'ceo';
      case 'hiring_manager':
      case 'hiring-manager':
        return 'hiring_manager';
      case 'department_manager':
      case 'department-manager':
        return 'department_manager';
      case 'interviewer':
        return 'interviewer';
      default:
        return 'candidate';
    }
  };

  const [currentRole, setRoleState] = useState<UserRole>(() =>
    authUser?.role ? normalizeRole(authUser.role) : 'candidate',
  );
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [planningViewIntent, setPlanningViewIntent] = useState<
    'create' | { edit: string } | null
  >(null);
  const [requestViewIntent, setRequestViewIntent] = useState<
    'create' | { edit: string } | null
  >(null);

  // role is initialized from authUser above; avoid setState inside effect

  // Simulated Relational Tables
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recruitmentRequests, setRecruitmentRequests] = useState<
    RecruitmentRequest[]
  >([]);
  const [workforcePlans, setWorkforcePlans] = useState<WorkforcePlan[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [screeningRules, setScreeningRules] = useState<ScreeningRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [jobTemplates, setJobTemplates] =
    useState<JobTemplate[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([]);
  const [talentPool, setTalentPool] =
    useState<TalentPoolEntry[]>([]);
  const [hrisIntegrationAvailable, setHrisIntegrationAvailable] =
    useState(true);
  const [hrisManualMode, setHrisManualModeState] = useState(false);
  const [vacancyHubView, setVacancyHubView] = useState<VacancyHubView>('list');
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    null,
  );
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Fetch data from backend once auth is resolved and token is valid
  useEffect(() => {
    if (!token || authLoading || !isAuthenticated) return;
    const fetchBackendData = async () => {
      const safeFetch = async <T,>(route: string, apply: (data: T) => void) => {
        try {
          const res = await apiFetch(route);
          if (res && res.status === 'success' && res.data) {
            apply(res.data as T);
            return true;
          }
        } catch (err) {
          console.warn(`Failed to fetch ${route}`, err);
        }
        return false;
      };

      const isCandidate = authUser?.role === 'candidate';
      // Helper: check if the current user has a given permission slug.
      // Uses the permissions array baked into the auth token at login time.
      const userPerms: string[] = authUser?.permissions ?? [];
      const hasPerm = (...slugs: string[]) =>
        slugs.some((s) => userPerms.includes(s));

      let loadedAnyLiveData = false;

      if (!isCandidate) {
        // Vacancies — anyone with vacancy:read
        if (hasPerm('vacancy:read')) {
          loadedAnyLiveData =
            (await safeFetch('/api/v1/vacancies', (data: any) => {
              setVacancies((data as any[]).map(mapBackendVacancy));
            })) || loadedAnyLiveData;
        }

        // Recruitment requests — only HR / recruiter roles
        if (hasPerm('recruitment_request:read')) {
          loadedAnyLiveData =
            (await safeFetch('/api/v1/recruitment/requests', (data: any) => {
              setRecruitmentRequests(
                (data as any[]).map(mapBackendRecruitmentRequest),
              );
            })) || loadedAnyLiveData;
        }

        // Workforce plans — only roles with plan access
        if (hasPerm('workforce_plan:read')) {
          loadedAnyLiveData =
            (await safeFetch('/api/v1/workforce/plans', (data: any) => {
              setWorkforcePlans((data as any[]).map(mapBackendWorkforcePlan));
            })) || loadedAnyLiveData;
        }

        loadedAnyLiveData =
          (await safeFetch('/api/v1/workforce/departments', (data: any) => {
            setDepartments(
              (Array.isArray(data) ? data : []).map((d: any) => ({
                id: d.id,
                name: d.name,
              })),
            );
          })) || loadedAnyLiveData;

        // Interviews — anyone who can view or evaluate interviews
        if (hasPerm('interview:read', 'interview:view', 'interview:evaluate')) {
          loadedAnyLiveData =
            (await safeFetch('/api/v1/interviews/list', (data: any) => {
              setInterviews((data as any[]).map(mapBackendInterview));
            })) || loadedAnyLiveData;
        }

        // Users list — only HR/admin who manages users
        if (hasPerm('config:manage', 'interview:create')) {
          loadedAnyLiveData =
            (await safeFetch('/api/v1/users', (data: any) => {
              setUsers(Array.isArray(data) ? data : []);
            })) || loadedAnyLiveData;
        }

        // Job templates — config:manage only
        if (hasPerm('config:manage')) {
          await safeFetch('/api/v1/config/job-templates', (data: any) => {
            const backendTemplates: JobTemplate[] = (
              Array.isArray(data) ? data : []
            ).map(
              (t: any): JobTemplate => ({
                id: t.id,
                organizationId: String(t.company_id ?? 'org-1'),
                name: t.title ?? 'Unnamed Template',
                title: t.title ?? '',
                description: t.summary ?? '',
                responsibilities: t.responsibilities ?? '',
                requirements: t.requirements ?? '',
                employmentType: (t.employment_type ?? 'full_time')
                  .toLowerCase()
                  .replace('_', '_') as any,
                skills: [],
                benefits: '',
                employmentTerms: '',
                experienceRequired: '',
                roleTier: 'standard',
                createdBy: t.created_by ?? '',
                createdAt: t.created_at ?? new Date().toISOString(),
                updatedAt: t.updated_at ?? new Date().toISOString(),
              }),
            );
            if (backendTemplates.length > 0) {
              setJobTemplates(backendTemplates);
            }
          });
        }

        // Job offers — HR with offer permissions
        if (hasPerm('offer:issue', 'offer:read')) {
          loadedAnyLiveData =
            (await safeFetch('/api/v1/offers/company', (data: any) => {
              const backendOffers: JobOffer[] = (Array.isArray(data) ? data : []).map(
                (o: any): JobOffer => ({
                  id: o.id,
                  displayCode: `OFF-${String(o.id).slice(-6).toUpperCase()}`,
                  organizationId: String(o.company_id),
                  applicationId: o.application_id,
                  candidateId: o.candidate_id,
                  candidateName: o.candidate
                    ? `${o.candidate.first_name} ${o.candidate.last_name}`
                    : 'Unknown',
                  vacancyId: o.application?.vacancy?.id || '',
                  positionTitle: o.application?.vacancy?.title || 'Position',
                  departmentName: o.application?.vacancy?.department?.name || '—',
                  salary: o.salary,
                  salaryCurrency: 'ETB',
                  employmentType: o.employment_type || 'FULL_TIME',
                  startDate: o.start_date,
                  allowances: o.allowances as Record<string, number> | undefined,
                  benefits: o.offer_notes || '',
                  expirationDate: o.expiry_date,
                  status: o.status.toLowerCase(),
                  templateId: o.template_id,
                  hrisSyncStatus: 'not_connected',
                  onboardingStatus: 'not_started',
                  manualOnboarding: true,
                  approvalRequired: false,
                  activities: [],
                  createdBy: o.created_by_user_id,
                  createdByName: 'HR User',
                  createdAt: o.created_at,
                  updatedAt: o.updated_at,
                }),
              );
              setJobOffers(backendOffers);
            })) || loadedAnyLiveData;
        }
      }

      const applicationsEndpoint =
        authUser && authUser.role !== 'candidate'
          ? '/api/v1/candidates/company/applications'
          : '/api/v1/candidates/applications';

      loadedAnyLiveData =
        (await safeFetch(applicationsEndpoint, (data: any) => {
          setApplications((data as any[]).map(mapBackendApplication));
        })) || loadedAnyLiveData;

      // If authenticated as candidate, fetch full candidate profile
      if (authUser && authUser.role === 'candidate') {
        try {
          const meRes = await apiFetch('/api/v1/candidates/me');
          if (meRes && meRes.status === 'success' && meRes.data) {
            const cand = meRes.data;
            setCandidates((prev) => {
              const exists = prev.find((p) => p.id === cand.id);
              if (exists)
                return [cand, ...prev.filter((p) => p.id !== cand.id)];
              return [cand, ...prev];
            });
            loadedAnyLiveData = true;
          }
        } catch (e) {
          console.warn('Failed to fetch candidate profile', e);
        }
      }

    };
    fetchBackendData();
  }, [token, authUser, authLoading, isAuthenticated]);

  // Candidate profile operations are handled by page-owned sagas and slices.

  // Set default current user profile based on active role
  const getCurrentUser = (): User => {
    if (authUser) {
      const normalizedRole = normalizeRole(authUser.role);
      return {
        id: authUser.id,
        organizationId: authUser.organizationId,
        firstName: authUser.firstName || 'User',
        lastName: authUser.lastName || '',
        email: authUser.email,
        roleSlug: normalizedRole as any,
        roleName: normalizedRole.replace('_', ' ').toUpperCase(),
        departmentId: authUser.departmentId,
        departmentName: authUser.departmentName,
      };
    }
    if (currentRole === 'candidate') {
      const activeCandidate = candidates[0];
      if (activeCandidate) {
        return {
          id: activeCandidate.id,
          organizationId: activeCandidate.organizationId,
          firstName: activeCandidate.firstName,
          lastName: activeCandidate.lastName,
          email: activeCandidate.email,
          phone: activeCandidate.phone,
          roleSlug: 'candidate' as any,
          roleName: 'Candidate Profile',
          avatarUrl: activeCandidate.profile?.profilePhotoUrl,
        };
      }
      return {
        id: 'candidate-placeholder',
        organizationId: 'org-1',
        firstName: 'Candidate',
        lastName: 'User',
        email: '',
        phone: '',
        roleSlug: 'candidate' as any,
        roleName: 'Candidate Profile',
      };
    } else {
      const foundUser = users.find((u) => u.roleSlug === currentRole);
      if (foundUser) return foundUser;
      if (users.length > 0) return users[0];
      return {
        id: 'staff-placeholder',
        organizationId: 'org-1',
        firstName: 'Staff',
        lastName: 'User',
        email: '',
        roleSlug: currentRole as any,
        roleName: currentRole.replace('_', ' ').toUpperCase(),
      };
    }
  };

  const setRole = (role: UserRole) => {
    setRoleState(role);
    // Reset tab to dashboard on role switch
    setActiveTabState('dashboard');
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  const touchVacancy = (_vacancy: Vacancy, user: User): Partial<Vacancy> => ({
    updatedAt: new Date().toISOString(),
    lastModifiedBy: user.id,
    lastModifiedByName: `${user.firstName} ${user.lastName}`,
  });

  const appendVacancyActivity = (
    vacancyId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === vacancyId
          ? {
              ...v,
              ...touchVacancy(v, user),
              activities: [
                ...v.activities,
                {
                  id: `act-${Date.now()}`,
                  vacancyId,
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  action,
                  timestamp: now,
                  metadata,
                },
              ],
            }
          : v,
      ),
    );
  };

  const appendWorkforcePlanActivity = (
    workforcePlanId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setWorkforcePlans((prev) =>
      prev.map((p) =>
        p.id === workforcePlanId
          ? {
              ...p,
              activities: [
                ...(p.activities || []),
                {
                  id: `wpa-${Date.now()}`,
                  workforcePlanId,
                  action,
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: now,
                  metadata,
                },
              ],
              updatedAt: now,
            }
          : p,
      ),
    );
  };

  const appendStatusHistory = (
    vacancyId: string,
    toStatus: VacancyStatus,
    fromStatus?: VacancyStatus,
    notes?: string,
  ) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === vacancyId
          ? {
              ...v,
              vacancyStatus: toStatus,
              filledAt: toStatus === 'filled' ? now : v.filledAt,
              publishedAt:
                toStatus === 'published' && !v.publishedAt
                  ? now
                  : v.publishedAt,
              ...touchVacancy(v, user),
              statusHistory: [
                ...v.statusHistory,
                {
                  id: `vsh-${Date.now()}`,
                  vacancyId,
                  fromStatus,
                  toStatus,
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  notes,
                  timestamp: now,
                },
              ],
            }
          : v,
      ),
    );
  };

  const transitionVacancyStatus = (
    vacancyId: string,
    toStatus: VacancyStatus,
    notes?: string,
  ) => {
    const vac = vacancies.find((v) => v.id === vacancyId);
    if (!vac) return;
    appendStatusHistory(vacancyId, toStatus, vac.vacancyStatus, notes);
    appendVacancyActivity(
      vacancyId,
      `Status changed to ${toStatus.replace('_', ' ')}${notes ? `: ${notes}` : ''}`,
    );
    notify(`Vacancy status updated to ${toStatus.replace('_', ' ')}.`);
  };

  const updateVacancyMeta = (
    vacancyId: string,
    updates: Partial<
      Pick<Vacancy, 'closingDate' | 'openPositions' | 'location' | 'isUrgent'>
    >,
  ) => {
    const user = getCurrentUser();
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === vacancyId
          ? {
              ...v,
              ...updates,
              ...touchVacancy(v, user),
            }
          : v,
      ),
    );
    appendVacancyActivity(vacancyId, 'Vacancy details updated');
    notify('Vacancy updated.');
  };

  const addVacancyNote = (vacancyId: string, body: string) => {
    const user = getCurrentUser();
    const note = {
      id: `vn-${Date.now()}`,
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      body,
      createdAt: new Date().toISOString(),
    };
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === vacancyId
          ? { ...v, notes: [...v.notes, note], ...touchVacancy(v, user) }
          : v,
      ),
    );
    notify('Note added.');
  };

  const getPublicVacancies = (): Vacancy[] =>
    vacancies.filter((v) => {
      const posting = jobPostings.find((p) => p.vacancyId === v.id);
      if (!posting)
        return v.vacancyStatus === 'open' || v.vacancyStatus === 'published';
      return isPostingPubliclyVisible(posting);
    });

  const getInternalVacancies = (): Vacancy[] =>
    vacancies.filter((v) => {
      const posting = jobPostings.find((p) => p.vacancyId === v.id);
      if (!posting) return false;
      return isPostingInternallyVisible(posting);
    });

  const recordPostingView = (vacancyId: string) => {
    setJobPostings((prev) =>
      prev.map((p) =>
        p.vacancyId === vacancyId ? { ...p, views: p.views + 1 } : p,
      ),
    );
  };

  const toggleSaveJob = (vacancyId: string) => {
    setSavedJobIds((prev) =>
      prev.includes(vacancyId)
        ? prev.filter((id) => id !== vacancyId)
        : [...prev, vacancyId],
    );
  };

  // FR-13: Create vacancy as draft (not immediate publish)
  const createVacancyDraftFromRequest = (requestId: string): string | null => {
    const request = recruitmentRequests.find((r) => r.id === requestId);
    if (!request) return null;
    if (!canCreateVacancy(getCurrentUser())) {
      notify('You are not permitted to create vacancies.', 'error');
      return null;
    }
    if (request.status !== 'approved') {
      notify(
        'Recruitment request must be approved before creating a vacancy.',
        'error',
      );
      return null;
    }
    const existing = vacancies.find(
      (v) => v.recruitmentRequestId === requestId,
    );
    if (existing) {
      notify(
        `Vacancy ${existing.displayCode} already exists for this request.`,
        'info',
      );
      return existing.id;
    }
    const user = getCurrentUser();
    const vacId = `vac-${Date.now()}`;
    const now = new Date().toISOString();
    const closing = new Date();
    closing.setDate(closing.getDate() + 90);
    const displayCode = generateVacancyDisplayCode(vacancies.length + 1);
    const newVacancy: Vacancy = {
      id: vacId,
      displayCode,
      organizationId: request.organizationId,
      recruitmentRequestId: request.id,
      recruitmentRequestReference: request.referenceCode,
      workforcePlanId: request.workforcePlanId,
      workforcePlanReference: request.workforcePlanReference,
      title: request.jobTitle,
      departmentId: request.departmentId,
      departmentName: request.departmentName,
      location: request.location || 'Addis Ababa, Headquarters',
      employmentType: request.employmentType,
      vacancyStatus: 'draft',
      openPositions: request.numberOfOpenings,
      salaryMin: request.salaryMin,
      salaryMax: request.salaryMax,
      description: request.jobDescription,
      responsibilities:
        request.requiredSkills.map((s) => `• ${s}`).join('\n') ||
        'Define key responsibilities.',
      requirements: `${request.experienceYears}+ years experience.\nSkills: ${request.requiredSkills.join(', ')}`,
      skills: request.requiredSkills,
      experienceRequired: `${request.experienceYears}+ years`,
      closingDate: closing.toISOString().slice(0, 10),
      hiringManagerId: request.hiringManagerId,
      hiringManagerName: request.hiringManagerName,
      ownerId: user.id,
      ownerName: `${user.firstName} ${user.lastName}`,
      isUrgent: request.requestType === 'unplanned',
      createdBy: user.id,
      lastModifiedBy: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
      createdAt: now,
      updatedAt: now,
      channels: [],
      notes: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          vacancyId: vacId,
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          action: `Vacancy ${displayCode} created from request ${request.referenceCode}`,
          timestamp: now,
        },
      ],
      statusHistory: [
        {
          id: `vsh-${Date.now()}`,
          vacancyId: vacId,
          toStatus: 'draft',
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          notes: `Linked to workforce plan: ${request.workforcePlanReference || 'N/A'}`,
          timestamp: now,
        },
      ],
    };
    setVacancies((prev) => [newVacancy, ...prev]);
    notify(`Vacancy ${displayCode} created.`);
    return vacId;
  };

  // Create a blank vacancy draft (manual creation by HR)
  const createVacancyDraft = (
    payload: Partial<Vacancy> = {},
  ): string | null => {
    if (!canCreateVacancy(getCurrentUser())) {
      notify('You are not permitted to create vacancies.', 'error');
      return null;
    }
    const user = getCurrentUser();
    const vacId = `vac-${Date.now()}`;
    const now = new Date().toISOString();
    const closing = payload.closingDate
      ? new Date(payload.closingDate)
      : new Date(Date.now() + 90 * 24 * 3600 * 1000);
    closing.setHours(0, 0, 0, 0);
    const displayCode = generateVacancyDisplayCode(vacancies.length + 1);
    const newVacancy: Vacancy = {
      id: vacId,
      displayCode,
      organizationId: 'org-1',
      recruitmentRequestId: payload.recruitmentRequestId || undefined,
      recruitmentRequestReference:
        payload.recruitmentRequestReference || undefined,
      workforcePlanId: payload.workforcePlanId || undefined,
      workforcePlanReference: payload.workforcePlanReference || undefined,
      title: payload.title || 'New vacancy title',
      departmentId: payload.departmentId || 'dept-custom',
      departmentName:
        payload.departmentName || payload.departmentName || 'General',
      location: payload.location || 'Addis Ababa, Headquarters',
      employmentType: payload.employmentType || 'full_time',
      vacancyStatus: 'draft',
      openPositions: payload.openPositions || 1,
      salaryMin: payload.salaryMin,
      salaryMax: payload.salaryMax,
      description: payload.description || '',
      responsibilities: payload.responsibilities || '',
      requirements: payload.requirements || '',
      skills: payload.skills || [],
      experienceRequired: payload.experienceRequired || '',
      closingDate: closing.toISOString().slice(0, 10),
      hiringManagerId: payload.hiringManagerId || user.id,
      hiringManagerName:
        payload.hiringManagerName || `${user.firstName} ${user.lastName}`,
      ownerId: user.id,
      ownerName: `${user.firstName} ${user.lastName}`,
      isUrgent: payload.isUrgent || false,
      createdBy: user.id,
      lastModifiedBy: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
      createdAt: now,
      updatedAt: now,
      channels: [],
      notes: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          vacancyId: vacId,
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          action: `Vacancy ${displayCode} manually created`,
          timestamp: now,
        },
      ],
      statusHistory: [
        {
          id: `vsh-${Date.now()}`,
          vacancyId: vacId,
          toStatus: 'draft',
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          notes: 'Manual draft created',
          timestamp: now,
        },
      ],
    } as Vacancy;
    setVacancies((prev) => [newVacancy, ...prev]);
    notify(`Vacancy ${displayCode} draft created.`);
    return vacId;
  };

  const updateVacancyJobContent = (
    vacancyId: string,
    form: JobDescriptionForm,
  ) => {
    const user = getCurrentUser();
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === vacancyId
          ? {
              ...v,
              title: form.title,
              description: form.description,
              responsibilities: form.responsibilities,
              requirements: form.requirements,
              skills: form.skills,
              benefits: form.benefits,
              employmentTerms: form.employmentTerms,
              experienceRequired: form.experienceRequired,
              notes: v.notes ?? [],
              ...touchVacancy(v, user),
            }
          : v,
      ),
    );
    appendVacancyActivity(vacancyId, 'Job description updated');
  };

  const saveJobTemplate = async (form: JobDescriptionForm, name: string) => {
    const user = getCurrentUser();
    // Build an optimistic local entry immediately so the UI updates without waiting
    const optimisticTmpl: JobTemplate = {
      id: `tmpl-${Date.now()}`,
      organizationId: 'org-1',
      name,
      title: form.title,
      description: form.description,
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      employmentType: 'full_time',
      skills: form.skills,
      benefits: form.benefits,
      employmentTerms: form.employmentTerms,
      experienceRequired: form.experienceRequired,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJobTemplates((prev) => [optimisticTmpl, ...prev]);
    notify(`Template "${name}" saved.`);

    // Persist to the backend — the DB stores title/responsibilities/requirements/summary
    try {
      const res = await apiFetch('/api/v1/config/job-templates', {
        method: 'POST',
        body: JSON.stringify({
          title: name, // template name IS the title in the DB
          employmentType: 'FULL_TIME',
          summary: form.description,
          responsibilities: form.responsibilities || 'N/A',
          requirements: form.requirements || 'N/A',
        }),
      });
      if (res?.status === 'success' && res?.data?.id) {
        // Replace optimistic entry with the persisted one (preserving frontend fields)
        setJobTemplates((prev) =>
          prev.map((t) =>
            t.id === optimisticTmpl.id
              ? { ...optimisticTmpl, id: res.data.id }
              : t,
          ),
        );
      }
    } catch (err) {
      console.warn(
        'Template saved locally only — backend persist failed:',
        err,
      );
    }
  };

  const applyJobTemplateToVacancy = (vacancyId: string, templateId: string) => {
    const tmpl = jobTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === vacancyId
          ? {
              ...v,
              jobTemplateId: templateId,
              title: tmpl.title,
              description: tmpl.description,
              responsibilities: tmpl.responsibilities,
              requirements: tmpl.requirements,
              skills: tmpl.skills,
              benefits: tmpl.benefits,
              employmentTerms: tmpl.employmentTerms,
              experienceRequired: tmpl.experienceRequired,
              employmentType: tmpl.employmentType,
            }
          : v,
      ),
    );
    appendVacancyActivity(vacancyId, `Applied template: ${tmpl.name}`);
  };

  const ensureJobPosting = (vacancyId: string): JobPosting => {
    const existing = jobPostings.find((p) => p.vacancyId === vacancyId);
    if (existing) return existing;
    const vac = vacancies.find((v) => v.id === vacancyId);
    if (!vac) {
      notify('Vacancy not found; creating placeholder posting.', 'info');
      const now = new Date().toISOString();
      const placeholder: JobPosting = {
        id: `post-${Date.now()}`,
        organizationId: '',
        vacancyId,
        postingTitle: 'Unknown vacancy',
        postingDescription: '',
        publicationStatus: 'draft',
        visibility: 'both',
        internalPosting: true,
        externalPosting: false,
        publishDate: undefined,
        scheduledPublishDate: undefined,
        expiryDate: undefined,
        closingDate: undefined,
        channels: defaultChannelStates([]),
        views: 0,
        applicationsCount: 0,
        requiresHrApproval: false,
        approvedBy: undefined,
        approvedByName: undefined,
        approvedAt: undefined,
        createdBy: getCurrentUser().id,
        createdByName: `${getCurrentUser().firstName} ${getCurrentUser().lastName}`,
        createdAt: now,
        updatedAt: now,
        publicationHistory: [],
      };
      setJobPostings((prev) => [placeholder, ...prev]);
      return placeholder;
    }
    const user = getCurrentUser();
    const posting: JobPosting = {
      id: `post-${Date.now()}`,
      organizationId: vac.organizationId,
      vacancyId: vac.id,
      postingTitle: vac.title,
      postingDescription: vac.description,
      publicationStatus: 'draft',
      visibility: 'both',
      internalPosting: true,
      externalPosting: true,
      closingDate: vac.closingDate,
      expiryDate: vac.closingDate ? `${vac.closingDate}T23:59:00Z` : undefined,
      channels: defaultChannelStates(['internal_portal', 'company_website']),
      views: 0,
      applicationsCount: 0,
      requiresHrApproval: true,
      createdBy: user.id,
      createdByName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publicationHistory: [
        {
          id: `ph-${Date.now()}`,
          action: 'Posting draft created',
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setJobPostings((prev) => [...prev, posting]);
    return posting;
  };

  const updateJobPostingChannels = (
    postingId: string,
    enabledSlugs: string[],
  ) => {
    setJobPostings((prev) =>
      prev.map((p) => {
        if (p.id !== postingId) return p;
        return {
          ...p,
          channels: POSTING_CHANNELS.map((ch) => ({
            channelSlug: ch.slug,
            enabled: enabledSlugs.includes(ch.slug),
            syncStatus: enabledSlugs.includes(ch.slug)
              ? ('pending' as const)
              : ('not_linked' as const),
            lastSyncAt: enabledSlugs.includes(ch.slug)
              ? new Date().toISOString()
              : undefined,
          })),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting)
      appendVacancyActivity(
        posting.vacancyId,
        `Channels updated: ${enabledSlugs.join(', ')}`,
      );
  };

  const updateJobPostingVisibility = (
    postingId: string,
    visibility: PostingVisibility,
  ) => {
    const internal = visibility === 'internal_only' || visibility === 'both';
    const external = visibility === 'external_only' || visibility === 'both';
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              visibility,
              internalPosting: internal,
              externalPosting: external,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  };

  const updateJobPostingClosingDate = (postingId: string, date: string) => {
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              closingDate: date,
              expiryDate: `${date}T23:59:00Z`,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting) {
      setVacancies((prev) =>
        prev.map((v) =>
          v.id === posting.vacancyId ? { ...v, closingDate: date } : v,
        ),
      );
    }
  };

  const publishJobPosting = (postingId: string) => {
    if (!['recruiter', 'hr_admin'].includes(currentRole)) {
      notify('Only HR users may publish job postings.', 'error');
      return;
    }
    const user = getCurrentUser();
    const now = new Date().toISOString();
    const tokenLocal = localStorage.getItem('token');
    if (tokenLocal) {
      const posting = jobPostings.find((p) => p.id === postingId);
      if (!posting) return;
      recruitmentService
        .postVacancy(posting.vacancyId)
        .then((vac) => {
          const mapped = mapBackendVacancy(vac);
          setVacancies((prev) => [
            mapped,
            ...prev.filter((v) => v.id !== mapped.id),
          ]);
          setJobPostings((prev) =>
            prev.map((p) =>
              p.id === postingId
                ? {
                    ...p,
                    publicationStatus: 'published',
                    publishDate: new Date().toISOString(),
                  }
                : p,
            ),
          );
          notify('Job posting published successfully.');
        })
        .catch((err) =>
          notify(`Failed to publish posting: ${err.message}`, 'error'),
        );
      return;
    }
    setJobPostings((prev) =>
      prev.map((p) => {
        if (p.id !== postingId) return p;
        const enabled = p.channels
          .filter((c) => c.enabled)
          .map((c) => c.channelSlug);
        return {
          ...p,
          publicationStatus: 'published' as const,
          publishDate: now,
          approvedBy: user.id,
          approvedByName: `${user.firstName} ${user.lastName}`,
          approvedAt: now,
          channels: p.channels.map((c) =>
            c.enabled
              ? { ...c, syncStatus: 'active' as const, lastSyncAt: now }
              : c,
          ),
          updatedAt: now,
          publicationHistory: [
            ...p.publicationHistory,
            {
              id: `ph-${Date.now()}`,
              action: `Published to ${enabled.length} channel(s)`,
              actorId: user.id,
              actorName: `${user.firstName} ${user.lastName}`,
              timestamp: now,
            },
          ],
        };
      }),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting) {
      const vac = vacancies.find((v) => v.id === posting.vacancyId);
      if (vac) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === posting.vacancyId
              ? {
                  ...v,
                  vacancyStatus: 'published',
                  publishedAt: now,
                  channels: posting.channels
                    .filter((c) => c.enabled)
                    .map((c) => c.channelSlug),
                }
              : v,
          ),
        );
        appendStatusHistory(
          posting.vacancyId,
          'published',
          vac.vacancyStatus,
          'Job posting published',
        );
        appendVacancyActivity(
          posting.vacancyId,
          'Job posting published to selected channels',
        );
      }
    }
    notify('Job posting published successfully.');
  };

  const scheduleJobPosting = (
    postingId: string,
    date: string,
    time: string,
  ) => {
    if (!['recruiter', 'hr_admin'].includes(currentRole)) return;
    const scheduled = `${date}T${time}:00Z`;
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              publicationStatus: 'pending_approval',
              scheduledPublishDate: scheduled,
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: `Scheduled for ${date} ${time}`,
                  actorId: getCurrentUser().id,
                  actorName: `${getCurrentUser().firstName} ${getCurrentUser().lastName}`,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : p,
      ),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting)
      appendVacancyActivity(
        posting.vacancyId,
        `Posting scheduled for ${date} ${time}`,
      );
    notify(`Posting scheduled for ${date} at ${time}.`);
  };

  const withdrawJobPosting = (postingId: string) => {
    if (!['recruiter', 'hr_admin'].includes(currentRole)) return;
    const user = getCurrentUser();
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              publicationStatus: 'withdrawn',
              channels: p.channels.map((c) => ({
                ...c,
                syncStatus: 'not_linked' as const,
              })),
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: 'Posting withdrawn',
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : p,
      ),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting) {
      appendStatusHistory(
        posting.vacancyId,
        'withdrawn',
        undefined,
        'Posting withdrawn from all channels',
      );
      appendVacancyActivity(posting.vacancyId, 'Job posting withdrawn');
    }
    notify('Posting withdrawn.');
  };

  const unpublishJobPosting = (postingId: string) => {
    if (!['recruiter', 'hr_admin'].includes(currentRole)) return;
    const user = getCurrentUser();
    const now = new Date().toISOString();
    const tokenLocal = localStorage.getItem('token');
    if (tokenLocal) {
      const posting = jobPostings.find((p) => p.id === postingId);
      if (!posting) return;
      recruitmentService
        .unpostVacancy(posting.vacancyId)
        .then((vac) => {
          const mapped = mapBackendVacancy(vac);
          setVacancies((prev) =>
            prev.map((v) => (v.id === mapped.id ? mapped : v)),
          );
          setJobPostings((prev) =>
            prev.map((p) =>
              p.id === postingId
                ? { ...p, publicationStatus: 'draft', publishDate: undefined }
                : p,
            ),
          );
          notify('Posting unpublished. It can be edited and republished.');
        })
        .catch((err) =>
          notify(`Failed to unpublish posting: ${err.message}`, 'error'),
        );
      return;
    }
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              publicationStatus: 'draft',
              publishDate: undefined,
              channels: p.channels.map((c) => ({
                ...c,
                syncStatus: 'not_linked' as const,
              })),
              updatedAt: now,
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: 'Unpublished from all channels',
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: now,
                },
              ],
            }
          : p,
      ),
    );
    notify('Posting unpublished. It can be edited and republished.');
  };

  const duplicateJobPosting = (postingId: string) => {
    const source = jobPostings.find((p) => p.id === postingId);
    if (!source) return;
    const user = getCurrentUser();
    const copy: JobPosting = {
      ...source,
      id: `post-${Date.now()}`,
      publicationStatus: 'draft',
      publishDate: undefined,
      views: 0,
      applicationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publicationHistory: [
        {
          id: `ph-${Date.now()}`,
          action: `Duplicated from ${source.id}`,
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setJobPostings((prev) => [...prev, copy]);
    notify('Posting duplicated as draft.');
  };

  const saveJobPostingDraft = (postingId: string) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              publicationStatus: 'draft',
              updatedAt: now,
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: 'Saved as draft',
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: now,
                },
              ],
            }
          : p,
      ),
    );
    notify('Posting saved as draft.');
  };

  const submitJobPostingForApproval = (postingId: string) => {
    if (!['recruiter', 'hr_admin'].includes(currentRole)) {
      notify('Only HR may submit postings for approval.', 'error');
      return;
    }
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId
          ? {
              ...p,
              publicationStatus: 'pending_approval',
              updatedAt: now,
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: 'Submitted for HR approval',
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: now,
                },
              ],
            }
          : p,
      ),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting)
      appendVacancyActivity(
        posting.vacancyId,
        'Job posting submitted for HR approval',
      );
    notify('Posting submitted for approval.');
  };

  const approveJobPosting = (postingId: string, notes?: string) => {
    if (!['ceo', 'recruiter', 'hr_admin'].includes(currentRole)) {
      notify('Only HR/CEO may approve job postings.', 'error');
      return;
    }
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId && p.publicationStatus === 'pending_approval'
          ? {
              ...p,
              approvedBy: user.id,
              approvedByName: `${user.firstName} ${user.lastName}`,
              approvedAt: now,
              updatedAt: now,
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: notes
                    ? `HR approved: ${notes}`
                    : 'HR approved — ready to publish',
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: now,
                },
              ],
            }
          : p,
      ),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting) {
      appendVacancyActivity(
        posting.vacancyId,
        `Job posting approved by ${user.firstName} ${user.lastName}${notes ? ` (${notes})` : ''}`,
      );
    }
    notify('Posting approved. HR may now publish.');
  };

  const rejectJobPosting = (postingId: string, rejectionReason: string) => {
    if (!['ceo', 'recruiter', 'hr_admin'].includes(currentRole)) {
      notify('Only HR/CEO may reject job postings.', 'error');
      return;
    }
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobPostings((prev) =>
      prev.map((p) =>
        p.id === postingId && p.publicationStatus === 'pending_approval'
          ? {
              ...p,
              publicationStatus: 'draft',
              updatedAt: now,
              publicationHistory: [
                ...p.publicationHistory,
                {
                  id: `ph-${Date.now()}`,
                  action: `HR rejected: ${rejectionReason}`,
                  actorId: user.id,
                  actorName: `${user.firstName} ${user.lastName}`,
                  timestamp: now,
                },
              ],
            }
          : p,
      ),
    );
    const posting = jobPostings.find((p) => p.id === postingId);
    if (posting) {
      appendVacancyActivity(
        posting.vacancyId,
        `Job posting rejected: ${rejectionReason}`,
      );
    }
    notify('Posting returned to draft for revision.');
  };

  const setVacancyOnHold = (vacancyId: string) => {
    appendStatusHistory(vacancyId, 'on_hold');
    appendVacancyActivity(vacancyId, 'Vacancy put on hold');
    notify('Hiring paused for this vacancy.');
  };

  // Mutator: Apply to Job
  const applyToJob = (
    vacancyId: string,
    coverLetter: string,
    _selectedDocIds: string[],
  ) => {
    const tokenLocal = localStorage.getItem('token');
    if (tokenLocal) {
      apiFetch('/api/v1/candidates/apply', {
        method: 'POST',
        body: JSON.stringify({ vacancyId, coverLetter }),
      })
        .then((res) => {
          const application = res.data || res;
          setApplications((prev) => [application, ...prev]);
          setJobPostings((prev) =>
            prev.map((p) =>
              p.vacancyId === vacancyId
                ? { ...p, applicationsCount: (p.applicationsCount || 0) + 1 }
                : p,
            ),
          );
          notify('Application submitted successfully!');
          setActiveTabState('dashboard');
        })
        .catch((err) => {
          notify(`Application error: ${err.message}`, 'error');
        });
      return;
    }

    const activeCand = candidates[0]; // Alex Sterling (Candidate)
    const vacancy = vacancies.find((v) => v.id === vacancyId);
    if (!vacancy) return;

    const posting = jobPostings.find((p) => p.vacancyId === vacancyId);
    if (posting && !isPostingPubliclyVisible(posting)) {
      notify(
        'This position is not currently accepting external applications.',
        'error',
      );
      return;
    }

    const existing = applications.find(
      (a) => a.candidateId === activeCand.id && a.vacancyId === vacancyId,
    );
    if (existing) {
      notify(
        'You have already submitted an application for this position.',
        'error',
      );
      return;
    }

    const newApp: Application = {
      id: `app-${Date.now()}`,
      organizationId: vacancy.organizationId,
      candidateId: activeCand.id,
      candidateName: `${activeCand.firstName} ${activeCand.lastName}`,
      candidateEmail: activeCand.email,
      candidateAvatar: activeCand.profile?.profilePhotoUrl,
      vacancyId: vacancy.id,
      vacancyTitle: vacancy.title,
      applicationSource: 'Company Website',
      applicationStatus: 'SUBMITTED',
      currentStage: 'Screening Queue',
      coverLetter,
      submittedAt: new Date().toISOString(),
      matchScore: 75,
    };

    setApplications((prev) => [newApp, ...prev]);
    if (posting) {
      setJobPostings((prev) =>
        prev.map((p) =>
          p.vacancyId === vacancyId
            ? { ...p, applicationsCount: p.applicationsCount + 1 }
            : p,
        ),
      );
    }
    notify('Application submitted in local demo mode.');
    setActiveTabState('dashboard');
  };

  const buildRequestFromPayload = (
    existing: RecruitmentRequest | null,
    requestId: string,
    payload: RecruitmentRequestFormPayload,
    status: RecruitmentRequest['status'],
    actor: User,
    changeSummary: string,
    statusLabel: string,
    workforcePlans: WorkforcePlan[],
  ): RecruitmentRequest => {
    const now = new Date().toISOString();
    const hm = users.find((u) => u.id === payload.hiringManagerId) || actor;
    const plan = payload.workforcePlanId
      ? workforcePlans.find((w) => w.id === payload.workforcePlanId)
      : undefined;
    const seq =
      (existing
        ? 0
        : recruitmentRequests.filter((r) =>
            r.referenceCode.includes(
              payload.workforcePlanId ? plan?.planningPeriod || '2026' : '2026',
            ),
          ).length) + 1;
    const referenceCode =
      existing?.referenceCode ||
      generateReferenceCode(plan?.planningPeriod || '2026', plan?.quarter, seq);

    const base: RecruitmentRequest = {
      id: requestId,
      organizationId: 'org-1',
      referenceCode,
      workforcePlanId: payload.workforcePlanId,
      workforcePlanItemId: payload.workforcePlanItemId,
      workforcePlanReference: plan
        ? buildWorkforcePlanReference(plan)
        : undefined,
      requestTitle: payload.requestTitle,
      requestedBy: actor.id,
      requestedByName: `${actor.firstName} ${actor.lastName}`,
      hiringManagerId: hm.id,
      hiringManagerName: `${hm.firstName} ${hm.lastName}`,
      departmentId: payload.departmentId,
      departmentName: payload.departmentName,
      jobTitle: payload.jobTitle ?? existing?.jobTitle ?? '',
      grade: payload.grade ?? existing?.grade ?? '',
      priority: payload.priority,
      employmentType:
        payload.employmentType ?? existing?.employmentType ?? 'full_time',
      numberOfOpenings:
        payload.numberOfOpenings ?? existing?.numberOfOpenings ?? 1,
      location: payload.location ?? existing?.location ?? '',
      requestType: payload.requestType,
      isReplacement: payload.isReplacement,
      replacementForEmployee:
        payload.isReplacement && payload.replacementEmployeeId
          ? `Employee ${payload.replacementEmployeeId}`
          : undefined,
      replacementEmployeeId: payload.isReplacement
        ? payload.replacementEmployeeId
        : undefined,
      replacementReason: payload.isReplacement
        ? payload.replacementReason
        : undefined,
      justificationReasonCategory:
        existing?.justificationReasonCategory || 'General',
      justification: payload.justification,
      supportingDocumentName: payload.supportingDocumentName,
      jobDescription: existing?.jobDescription || '',
      requiredSkills: existing?.requiredSkills || [],
      experienceYears: existing?.experienceYears || 0,
      salaryMin: existing?.salaryMin,
      salaryMax: existing?.salaryMax,
      reportingManager: existing?.reportingManager,
      jobTemplateId: existing?.jobTemplateId,
      status,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      revisions: existing?.revisions ?? [],
      activities: existing?.activities ?? [],
      linkedVacancyId: existing?.linkedVacancyId,
      hrReviewedBy: existing?.hrReviewedBy,
      hrReviewedByName: existing?.hrReviewedByName,
      hrReviewDate: existing?.hrReviewDate,
      hrReviewNotes: existing?.hrReviewNotes,
      approvedBy: existing?.approvedBy,
      approvedByName: existing?.approvedByName,
      approvedAt: existing?.approvedAt,
    };

    const revision = buildRequestRevision(
      `${actor.firstName} ${actor.lastName}`,
      actor.roleName,
      changeSummary,
      statusLabel,
    );
    const shouldAddRevision = !existing || statusLabel === 'Approved';
    return {
      ...base,
      revisions: shouldAddRevision
        ? [...base.revisions, revision]
        : base.revisions,
    };
  };

  // Recruitment request flows are handled by page-owned sagas/slices.

  const createVacancyFromApprovedRequest = (
    requestId: string,
  ): string | null => {
    const request = recruitmentRequests.find((r) => r.id === requestId);
    if (!canCreateVacancy(getCurrentUser())) {
      notify('You are not permitted to create vacancies.', 'error');
      return null;
    }
    if (!request || request.status !== 'approved') {
      notify('Only approved requests can generate vacancies.', 'error');
      return null;
    }
    if (request.linkedVacancyId) {
      notify('Vacancy already exists for this request.', 'info');
      setSelectedVacancyId(request.linkedVacancyId);
      setVacancyHubView('detail');
      setActiveTabState('vacancies');
      return request.linkedVacancyId;
    }

    const tokenLocal = localStorage.getItem('token');
    if (tokenLocal) {
      recruitmentService
        .createVacancy({
          recruitmentRequestId: request.id,
          title: request.jobTitle || request.requestTitle,
          location: request.location || 'Addis Ababa, Headquarters',
          employmentType: request.employmentType,
          openPositions: request.numberOfOpenings || 1,
          salaryMin: request.salaryMin || 0,
          salaryMax: request.salaryMax || 0,
          description: request.jobDescription || request.justification || 'TBD',
          responsibilities: request.requiredSkills
            ? request.requiredSkills.map((s) => `• ${s}`).join('\n')
            : 'TBD',
          requirements: request.justification || 'TBD',
        })
        .then((vacancy) => {
          const mappedVacancy = mapBackendVacancy(vacancy);
          setVacancies((prev) => [mappedVacancy, ...prev]);
          setRecruitmentRequests((prev) =>
            prev.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    linkedVacancyId: mappedVacancy.id,
                    status: 'approved',
                  }
                : r,
            ),
          );
          setSelectedVacancyId(vacancy.id);
          setVacancyHubView('detail');
          setActiveTabState('vacancies');
          notify(
            `Vacancy ${vacancy.id} created from request ${request.referenceCode}.`,
          );
        })
        .catch((err) => {
          notify(`Failed to create vacancy: ${err.message}`, 'error');
        });
      return requestId;
    }

    const vacId = createVacancyDraftFromRequest(requestId);
    if (!vacId) return null;
    setRecruitmentRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              linkedVacancyId: vacId,
              revisions: [
                ...r.revisions,
                buildRequestRevision(
                  `${getCurrentUser().firstName} ${getCurrentUser().lastName}`,
                  getCurrentUser().roleName,
                  `Vacancy ${vacId} created from request.`,
                  'Linked',
                ),
              ],
            }
          : r,
      ),
    );
    notify(
      `Vacancy draft created — traceability: ${request.referenceCode} → ${vacId}`,
    );
    return vacId;
  };

  /** @deprecated Use createVacancyDraftFromRequest + job posting workflow */
  const createVacancyFromRequest = (
    requestId: string,
    salaryMin: number,
    salaryMax: number,
    description: string,
    responsibilities: string,
    requirements: string,
    _channels: string[] = ['company_website', 'telegram'],
  ) => {
    const id = createVacancyDraftFromRequest(requestId);
    if (!id) return;
    updateVacancyJobContent(id, {
      title:
        recruitmentRequests.find((r) => r.id === requestId)?.jobTitle || '',
      description,
      responsibilities,
      requirements,
      skills: [],
      benefits: '',
      employmentTerms: '',
      experienceRequired: '',
    });
    setVacancies((prev) =>
      prev.map((v) => (v.id === id ? { ...v, salaryMin, salaryMax } : v)),
    );
    setSelectedVacancyId(id);
    setVacancyHubView('editor');
    notify(
      'Draft vacancy created. Complete job description, then use Posting Control to publish.',
    );
  };

  const shortlistApplication = (
    applicationId: string,
    screeningNotes?: string,
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              applicationStatus: 'SHORTLISTED',
              currentStage: 'Shortlisted',
              screeningComments: screeningNotes
                ? [app.screeningComments, screeningNotes]
                    .filter(Boolean)
                    .join('\n\n')
                : app.screeningComments,
            }
          : app,
      ),
    );
  };

  const rescheduleInterview = (
    interviewId: string,
    scheduledStart: string,
    scheduledEnd: string,
    interviewType: 'physical' | 'virtual' | 'hybrid',
    segments?: {
      segmentType: 'physical' | 'virtual';
      start: string;
      end: string;
      location?: string;
      meetingLink?: string;
    }[],
  ) => {
    setInterviews((prev) =>
      prev.map((int) =>
        int.id === interviewId
          ? {
              ...int,
              scheduledStart,
              scheduledEnd,
              interviewType,
              interviewStatus: 'scheduled' as const,
              hybridSegments: segments ?? int.hybridSegments,
              location: interviewType !== 'virtual' ? int.location : undefined,
              meetingLink:
                interviewType !== 'physical' ? int.meetingLink : undefined,
            }
          : int,
      ),
    );
    notify('Interview rescheduled. Panel and candidate have been notified.');
  };

  const appendOfferActivity = (
    _offerId: string,
    action: string,
    user?: User,
  ): OfferActivity => {
    const u = user ?? getCurrentUser();
    return {
      id: `oa-${Date.now()}`,
      action,
      actorId: u.id,
      actorName: `${u.firstName} ${u.lastName}`,
      timestamp: new Date().toISOString(),
    };
  };

  const createOfferFromApplication = async (
    payload: OfferFormPayload,
  ): Promise<string | null> => {
    const app = applications.find((a) => a.id === payload.applicationId);
    if (!app) return null;
    if (
      jobOffers.some(
        (o) =>
          o.applicationId === app.id &&
          !['withdrawn', 'rejected', 'expired'].includes(o.status),
      )
    ) {
      notify('An active offer already exists for this application.', 'error');
      return null;
    }

    const tokenLocal = localStorage.getItem('token');
    if (tokenLocal) {
      try {
        const response = await apiFetch('/api/v1/offers/issue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            application_id: payload.applicationId,
            salary: payload.salary,
            employment_type: payload.employmentType,
            start_date: payload.startDate,
            expiry_date: payload.expirationDate,
            offer_notes: payload.benefits,
            template_id: payload.templateId,
            allowances: (payload as any).allowances,
          }),
        });

        if (response && response.status === 'success' && response.data) {
          const backendOffer = response.data;
          const mappedOffer: JobOffer = {
            id: backendOffer.id,
            displayCode: generateOfferDisplayCode(jobOffers.length + 1),
            organizationId: String(backendOffer.company_id),
            applicationId: backendOffer.application_id,
            candidateId: backendOffer.candidate_id,
            candidateName: backendOffer.candidate
              ? `${backendOffer.candidate.first_name} ${backendOffer.candidate.last_name}`
              : 'Unknown',
            vacancyId: app.vacancyId,
            positionTitle: backendOffer.application?.vacancy?.title || app.vacancyTitle,
            departmentName: backendOffer.application?.vacancy?.department?.name || '—',
            salary: backendOffer.salary,
            salaryCurrency: 'ETB',
            employmentType: backendOffer.employment_type || 'FULL_TIME',
            startDate: backendOffer.start_date,
            allowances: backendOffer.allowances as Record<string, number> | undefined,
            benefits: backendOffer.offer_notes || '',
            expirationDate: backendOffer.expiry_date,
            status: backendOffer.status.toLowerCase(),
            templateId: backendOffer.template_id,
            hrisSyncStatus: 'not_connected',
            onboardingStatus: 'not_started',
            manualOnboarding: true,
            approvalRequired: false,
            activities: [],
            createdBy: backendOffer.created_by_user_id,
            createdByName: 'HR User',
            createdAt: backendOffer.created_at,
            updatedAt: backendOffer.updated_at,
          };

          setJobOffers((prev) => [...prev, mappedOffer]);
          setApplications((prev) =>
            prev.map((a) =>
              a.id === app.id
                ? { ...a, applicationStatus: 'OFFER_ISSUED', currentStage: 'Offer Stage' }
                : a,
            ),
          );
          notify('Offer created successfully.');
          return mappedOffer.id;
        }
      } catch (err: any) {
        notify(`Failed to create offer: ${err.message}`, 'error');
        return null;
      }
      return null;
    }

    // Fallback to mock mode if no token
    const vac = vacancies.find((v) => v.id === app.vacancyId);
    const user = getCurrentUser();
    const tmpl = payload.templateId
      ? offerTemplates.find((t) => t.id === payload.templateId)
      : undefined;
    const offerId = `offer-${Date.now()}`;
    const offer: JobOffer = {
      id: offerId,
      displayCode: generateOfferDisplayCode(jobOffers.length + 1),
      organizationId: app.organizationId,
      applicationId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidateName,
      vacancyId: app.vacancyId,
      positionTitle: vac?.title || app.vacancyTitle,
      departmentName: vac?.departmentName || '—',
      salary: payload.salary,
      salaryCurrency: 'ETB',
      employmentType: payload.employmentType,
      startDate: payload.startDate,
      allowances: (payload as any).allowances || {},
      benefits: payload.benefits || tmpl?.defaultBenefits,
      expirationDate: payload.expirationDate,
      status: 'draft',
      templateId: payload.templateId,
      hrisSyncStatus:
        hrisManualMode || !hrisIntegrationAvailable
          ? 'manual_mode'
          : 'not_connected',
      onboardingStatus: 'not_started',
      manualOnboarding: hrisManualMode || !hrisIntegrationAvailable,
      approvalRequired: true,
      activities: [
        appendOfferActivity(
          offerId,
          'Offer generated from interview pass',
          user,
        ),
      ],
      createdBy: user.id,
      createdByName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJobOffers((prev) => [...prev, offer]);
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? { ...a, applicationStatus: 'OFFER_ISSUED', currentStage: 'Offer Stage' }
          : a,
      ),
    );
    notify('Offer created in local demo mode.');
    return offerId;
  };

  const updateOffer = (offerId: string, updates: Partial<JobOffer>) => {
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, ...updates, updatedAt: new Date().toISOString() }
          : o,
      ),
    );
  };

  const submitOfferForApproval = (offerId: string) => {
    const user = getCurrentUser();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'pending_approval',
              activities: [
                ...o.activities,
                appendOfferActivity(
                  offerId,
                  'Submitted for HR/CEO approval',
                  user,
                ),
              ],
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    notify('Offer submitted for approval.');
  };

  const approveJobOffer = (offerId: string) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              approvedBy: user.id,
              approvedByName: `${user.firstName} ${user.lastName}`,
              approvedAt: now,
              activities: [
                ...o.activities,

                appendOfferActivity(
                  offerId,
                  'Offer approved by executive',
                  user,
                ),
              ],
              updatedAt: now,
            }
          : o,
      ),
    );
    notify('Offer approved. HR may send to candidate.');
  };

  const sendOffer = (offerId: string) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'sent',
              sentAt: now,
              activities: [
                ...o.activities,
                appendOfferActivity(offerId, 'Offer sent to candidate', user),
              ],
              updatedAt: now,
            }
          : o,
      ),
    );
    notify('Offer sent to candidate.');
  };

  const acceptJobOffer = (offerId: string) => {
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'accepted',
              acceptedAt: now,
              activities: [
                ...o.activities,
                appendOfferActivity(
                  offerId,
                  'Offer accepted by candidate',
                  user,
                ),
              ],
              updatedAt: now,
            }
          : o,
      ),
    );
    const offer = jobOffers.find((o) => o.id === offerId);
    if (offer) {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === offer.applicationId
            ? { ...a, currentStage: 'Offer Accepted' }
            : a,
        ),
      );
    }
    notify('Offer accepted.');
  };

  const withdrawOffer = (offerId: string) => {
    const user = getCurrentUser();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'withdrawn',
              activities: [
                ...o.activities,
                appendOfferActivity(offerId, 'Offer withdrawn', user),
              ],
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    notify('Offer withdrawn.');
  };

  const reviseOffer = (offerId: string) => {
    const user = getCurrentUser();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'draft',
              sentAt: undefined,
              activities: [
                ...o.activities,
                appendOfferActivity(
                  offerId,
                  'Offer revised — returned to draft',
                  user,
                ),
              ],
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    notify('Offer reopened for revision.');
  };

  const syncOfferToHris = (offerId: string) => {
    const offer = jobOffers.find((o) => o.id === offerId);
    if (!offer || offer.status !== 'accepted') {
      notify('Offer must be accepted before HRIS transfer.', 'error');
      return;
    }
    const user = getCurrentUser();
    const now = new Date().toISOString();

    if (!hrisIntegrationAvailable || hrisManualMode) {
      setJobOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? {
                ...o,
                hrisSyncStatus: 'manual_mode',
                manualOnboarding: true,
                activities: [
                  ...o.activities,
                  appendOfferActivity(
                    offerId,
                    'HRIS unavailable — manual onboarding mode',
                    user,
                  ),
                ],
                updatedAt: now,
              }
            : o,
        ),
      );
      notify('HRIS unavailable. Continue with manual onboarding.');
      return;
    }

    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              hrisSyncStatus: 'pending',
              activities: [
                ...o.activities,
                appendOfferActivity(offerId, 'HRIS sync initiated', user),
              ],
              updatedAt: now,
            }
          : o,
      ),
    );

    setTimeout(() => {
      setJobOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? {
                ...o,
                hrisSyncStatus: 'synced',
                hrisEmployeeId: `EMP-${Date.now().toString().slice(-6)}`,
                hrisLastSyncAt: new Date().toISOString(),
                activities: [
                  ...o.activities,
                  {
                    id: `oa-${Date.now()}`,
                    action: '✅ Synced with CBE-HRIS',
                    actorId: 'system',
                    actorName: 'HRIS Connector',
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : o,
        ),
      );
      notify('Candidate synced with CBE-HRIS.');
    }, 800);
  };

  const initiateOnboarding = (offerId: string) => {
    const offer = jobOffers.find((o) => o.id === offerId);
    if (!offer) return;
    const user = getCurrentUser();
    const now = new Date().toISOString();
    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              onboardingStatus: 'in_progress',
              activities: [
                ...o.activities,
                appendOfferActivity(offerId, 'Onboarding initiated', user),
              ],
              updatedAt: now,
            }
          : o,
      ),
    );
    setApplications((prev) =>
      prev.map((a) =>
        a.id === offer.applicationId
          ? {
              ...a,
              applicationStatus: 'OFFER_ACCEPTED',
              currentStage: 'Onboarding In Progress',
            }
          : a,
      ),
    );
    notify('Onboarding workflow started.');
  };

  const setHrisManualMode = (enabled: boolean) => {
    setHrisManualModeState(enabled);
    if (enabled) setHrisIntegrationAvailable(false);
    notify(
      enabled
        ? 'Manual onboarding mode enabled.'
        : 'HRIS integration restored.',
    );
  };

  const transferToHris = (applicationId: string) => {
    const offer = jobOffers.find((o) => o.applicationId === applicationId);
    if (offer) {
      if (offer.status !== 'accepted') acceptJobOffer(offer.id);
      syncOfferToHris(offer.id);
      setTimeout(() => initiateOnboarding(offer.id), 1000);
      return;
    }
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              applicationStatus: 'OFFER_ACCEPTED',
              currentStage: 'Hired — HRIS Onboarding Initiated',
            }
          : app,
      ),
    );
    notify('Candidate transferred to CBE-HRIS (legacy path).');
  };

  // Mutator: Schedule Interview (HR)
  const scheduleInterview = (
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
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    const panelMembers = panelIds.map((id) => {
      const u = users.find((user) => user.id === id)!;
      return {
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        roleSlug: u.roleSlug,
      };
    });

    const round = options?.round ?? 1;
    const parentInterviewId = options?.parentInterviewId;

    // If hybrid with explicit segments
    let hybridSegments = options?.segments;
    let start = scheduledStart;
    let end = scheduledEnd;
    let computedMeetingLink = options?.meetingLink;

    if (interviewType === 'hybrid' && hybridSegments && hybridSegments.length) {
      // normalize meeting links for virtual segments
      hybridSegments = hybridSegments.map((s, idx) => ({
        ...s,
        meetingLink:
          s.meetingLink ||
          (s.segmentType === 'virtual'
            ? 'https://meet.capitalbank.et/r/' +
              `${app.candidateName.toLowerCase().replace(/ /g, '-')}-${idx}`
            : undefined),
      }));
      const starts = hybridSegments.map((s) => new Date(s.start).getTime());
      const ends = hybridSegments.map((s) => new Date(s.end).getTime());
      start = new Date(Math.min(...starts)).toISOString();
      end = new Date(Math.max(...ends)).toISOString();
      computedMeetingLink = undefined; // top-level link not used for hybrid
    } else {
      computedMeetingLink =
        options?.meetingLink ??
        (interviewType !== 'physical'
          ? 'https://meet.capitalbank.et/r/' +
            app.candidateName.toLowerCase().replace(/ /g, '-')
          : undefined);
    }

    const newInterview: Interview = {
      id: `int-${Date.now()}`,
      organizationId: app.organizationId,
      applicationId: app.id,
      candidateName: app.candidateName,
      vacancyTitle: app.vacancyTitle,
      interviewRound: round,
      parentInterviewId,
      interviewType,
      scheduledStart: start,
      scheduledEnd: end,
      location: interviewType !== 'virtual' ? location : undefined,
      meetingLink: computedMeetingLink,
      interviewStatus: 'scheduled',
      panelMembers,
      questions,
      hybridSegments: hybridSegments,
    };

    setInterviews((prev) => [newInterview, ...prev]);
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              applicationStatus: 'INTERVIEW_SCHEDULED',
              currentStage: 'Interviewing',
            }
          : a,
      ),
    );
    notify('Interview scheduled successfully!');
  };

  const assignTalentToVacancy = (
    talentEntryId: string,
    vacancyId: string,
  ): string | undefined => {
    const entry = talentPool.find((t) => t.id === talentEntryId);
    const vac = vacancies.find((v) => v.id === vacancyId);
    if (!entry || !vac) return undefined;
    const exists = applications.find(
      (a) => a.candidateId === entry.candidateId && a.vacancyId === vacancyId,
    );
    if (exists) {
      notify('Candidate already has an application for this vacancy.', 'info');
      return exists.id;
    }
    const newApp: Application = {
      id: `app-${Date.now()}`,
      organizationId: entry.organizationId,
      candidateId: entry.candidateId,
      candidateName: entry.candidateName,
      candidateEmail: entry.email,
      vacancyId: vac.id,
      vacancyTitle: vac.title,
      applicationSource: 'Talent Pool',
      applicationStatus: 'SHORTLISTED',
      currentStage: 'Reused from Talent Pool',
      submittedAt: new Date().toISOString(),
      matchScore: 85,
      screeningComments: `Re-engaged from talent pool (${entry.tier}).`,
    };
    setApplications((prev) => [...prev, newApp]);
    notify(`${entry.candidateName} added to ${vac.title} pipeline.`);
    return newApp.id as string;
  };

  const inviteTalentToInterview = (
    talentEntryId: string,
    vacancyId: string,
  ) => {
    const appId = assignTalentToVacancy(talentEntryId, vacancyId);
    if (!appId) return;
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const iso = start.toISOString();
    scheduleInterview(
      appId,
      'virtual',
      iso,
      new Date(start.getTime() + 3600000).toISOString(),
      'Capital Bank HQ — Talent Pool Re-engagement',
      [users.find((u) => u.roleSlug === 'recruiter')?.id || 'user-1'],
      [],
    );
  };

  // Mutator: Submit Interview Evaluation (Hiring Manager scorecard)
  const submitInterviewEvaluation = (
    interviewId: string,
    overallScore: number,
    recommendation: 'pass' | 'fail' | 'hold',
    comments: string,
    criteriaScores: any[],
  ) => {
    const manager = getCurrentUser();
    const evaluation = {
      id: `eval-${Date.now()}`,
      interviewId,
      evaluatorId: manager.id,
      evaluatorName: `${manager.firstName} ${manager.lastName}`,
      overallScore,
      recommendation,
      comments,
      submittedAt: new Date().toISOString(),
      criteriaScores,
    };

    setInterviews((prev) =>
      prev.map((int) => {
        if (int.id === interviewId) {
          return {
            ...int,
            interviewStatus: 'completed',
            evaluations: [...(int.evaluations || []), evaluation],
          };
        }
        return int;
      }),
    );

    // Update Application status
    const int = interviews.find((i) => i.id === interviewId);
    if (int) {
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === int.applicationId) {
            let nextStatus = app.applicationStatus;
            let nextStage = app.currentStage;
            if (recommendation === 'pass') {
              nextStatus = 'OFFER_ISSUED';
              nextStage = 'Offer Stage';
            } else if (recommendation === 'fail') {
              nextStatus = 'REJECTED';
              nextStage = 'Rejected';
            } else {
              nextStatus = 'UNDER_SCREENING';
              nextStage = 'Under Hold Review';
            }
            return {
              ...app,
              applicationStatus: nextStatus,
              currentStage: nextStage,
              evaluationScore: overallScore,
            };
          }
          return app;
        }),
      );
    }

    notify('Interview evaluation scorecard submitted successfully!');
  };

  // Mutator: Reject and optionally move candidate to Talent Roster
  const moveToTalentRoster = (
    applicationId: string,
    comments: string,
    options?: {
      addToPool?: boolean;
      rejectionReason?: string;
      tags?: string[];
      futureFitLabels?: string[];
    },
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    const addToPool = options?.addToPool !== false;
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              applicationStatus: 'REJECTED',
              currentStage: addToPool
                ? 'Archived in Talent Roster'
                : 'Rejected',
              screeningComments: comments,
              rejectionReason: options?.rejectionReason || comments,
            }
          : a,
      ),
    );
    if (addToPool && app) {
      const cand = candidates.find((c) => c.id === app.candidateId);
      if (cand && !talentPool.some((t) => t.candidateId === cand.id)) {
        const user = getCurrentUser();
        const entry = buildTalentEntryFromRejection(cand, app, interviews, {
          rejectionReason: options?.rejectionReason || comments,
          tags: options?.tags || [],
          futureFitLabels: options?.futureFitLabels || ['Future Fit'],
          addedByName: `${user.firstName} ${user.lastName}`,
        });
        setTalentPool((prev) => [...prev, entry]);
      }
    }
    notify(
      addToPool
        ? 'Candidate rejected and added to Talent Roster.'
        : 'Candidate rejected.',
    );
  };

  // candidate helper implementations removed; page-owned sagas now handle these operations

  const completeOnboarding = (data: {
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
  }) => {
    const activeCand = candidates[0];
    const skillRows: CandidateSkill[] = data.skills.map((name, i) => ({
      id: `skill-${Date.now()}-${i}`,
      candidateId: activeCand.id,
      skillName: name,
      proficiencyLevel: 'advanced',
      yearsOfExperience: 3,
    }));
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === activeCand.id
          ? {
              ...c,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              city: data.city,
              country: data.country,
              linkedinUrl: data.linkedinUrl,
              education: data.education,
              experience: data.experience,
              // compute yearsOfExperience from full dates
              yearsOfExperience: (() => {
                try {
                  const months = (data.experience || []).reduce(
                    (sum: number, exp: any) => {
                      const start = new Date(exp.startDate);
                      const end =
                        exp.isCurrent || !exp.endDate
                          ? new Date()
                          : new Date(exp.endDate);
                      if (
                        Number.isNaN(start.getTime()) ||
                        Number.isNaN(end.getTime())
                      )
                        return sum;
                      return (
                        sum +
                        Math.max(
                          0,
                          (end.getFullYear() - start.getFullYear()) * 12 +
                            (end.getMonth() - start.getMonth()),
                        )
                      );
                    },
                    0,
                  );
                  return Math.floor(months / 12);
                } catch (e) {
                  return (
                    data.experience?.reduce(
                      (s: number, e: any) => s + (e.yearsOfExperience || 0),
                      0,
                    ) || 0
                  );
                }
              })(),
              skills: skillRows,
              certifications: data.certifications,
              onboardingCompleted: true,
              profileCompletionPercentage: 100,
              profile: {
                ...c.profile!,
                id: c.profile?.id || `cp-${c.id}`,
                candidateId: c.id,
                summary: data.summary,
                expectedSalary: data.expectedSalary,
                noticePeriod: data.noticePeriod,
                skillsText: data.skills.join(', '),
              },
            }
          : c,
      ),
    );
    notify('Profile complete! You can now browse jobs and track applications.');
    setActiveTabState('dashboard');
  };

  const deleteJobTemplate = (templateId: string) => {
    setJobTemplates((prev) => prev.filter((t) => t.id !== templateId));
    notify('Job template deleted.');
  };

  const rejectOfferApplication = (applicationId: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              applicationStatus: 'REJECTED',
              currentStage: 'Offer rejected by CEO',
            }
          : app,
      ),
    );
    const offer = jobOffers.find((o) => o.applicationId === applicationId);
    if (offer) {
      setJobOffers((prev) =>
        prev.map((o) =>
          o.id === offer.id
            ? {
                ...o,
                status: 'rejected',
                activities: [
                  ...o.activities,
                  appendOfferActivity(offer.id, 'Offer rejected by CEO'),
                ],
              }
            : o,
        ),
      );
    }
    notify('Offer rejected and returned to HR.');
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole,
        currentUser: getCurrentUser(),
        users,
        departments,
        candidates,
        vacancies,
        applications,
        recruitmentRequests,
        workforcePlans,
        interviews,
        questionBank,
        screeningRules,
        jobTemplates,
        jobPostings,
        jobOffers,
        offerTemplates,
        talentPool,
        hrisIntegrationAvailable: hrisIntegrationAvailable && !hrisManualMode,
        hrisManualMode,
        setHrisManualModeState,
        activeTab,
        setActiveTab,
        planningViewIntent,
        setPlanningViewIntent,
        requestViewIntent,
        setRequestViewIntent,
        vacancyHubView,
        setVacancyHubView,
        selectedVacancyId,
        setSelectedVacancyId,
        savedJobIds,
        toggleSaveJob,
        getPublicVacancies,
        getInternalVacancies,
        recordPostingView,
        applyToJob,
        createVacancyFromApprovedRequest,
        createVacancyFromRequest,
        createVacancyDraftFromRequest,
        createVacancyDraft,
        updateVacancyJobContent,
        saveJobTemplate,
        applyJobTemplateToVacancy,
        ensureJobPosting,
        updateJobPostingChannels,
        updateJobPostingVisibility,
        updateJobPostingClosingDate,
        publishJobPosting,
        scheduleJobPosting,
        withdrawJobPosting,
        unpublishJobPosting,
        duplicateJobPosting,
        saveJobPostingDraft,
        submitJobPostingForApproval,
        approveJobPosting,
        rejectJobPosting,
        setVacancyOnHold,
        transitionVacancyStatus,
        updateVacancyMeta,
        addVacancyNote,
        scheduleInterview,
        submitInterviewEvaluation,
        moveToTalentRoster,
        shortlistApplication,
        rescheduleInterview,
        transferToHris,
        createOfferFromApplication,
        updateOffer,
        sendOffer,
        withdrawOffer,
        reviseOffer,
        submitOfferForApproval,
        approveJobOffer,
        acceptJobOffer,
        syncOfferToHris,
        initiateOnboarding,
        setHrisManualMode,
        assignTalentToVacancy,
        inviteTalentToInterview,
        // Candidate profile actions are now handled by page-owned sagas and slices
        completeOnboarding,
        rejectOfferApplication,
        deleteJobTemplate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
