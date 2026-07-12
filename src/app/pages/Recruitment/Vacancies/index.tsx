import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '@/state';
import { useAppDispatch, useAppSelector} from '@/hooks';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { JobDescriptionEditor } from './components/job-posting/JobDescriptionEditor';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';
import { JobPostingControl } from './components/job-posting/JobPostingControl';
import { JobPreviewPage } from './components/job-posting/JobPreviewPage';
import { VacancyManagementDetail } from './components/VacancyManagementDetail';
import { VacancyHubCreateView } from './components/VacancyHubCreateView';
import { VacancyHubListView } from './components/VacancyHubListView';
import { VacancyHubMetrics } from './components/VacancyHubMetrics';
import { useRecruitmentRequestsSlice } from '@/pages/Recruitment/RecruitmentRequests/slice';
import { recruitmentRequestsActions } from '@/pages/Recruitment/RecruitmentRequests/slice';
import { selectRecruitmentRequests } from '@/pages/Recruitment/RecruitmentRequests/slice/selectors';
import {
  aggregateByDepartment,
  averageTimeToFillDays,
  isUrgentVacancy,
} from '@/utils/vacancyManagement';
import type {
  Application,
  JobPosting,
  PublicationStatus,
  PostingVisibility,
  RecruitmentRequest,
  Vacancy,
} from '@/types';
import { useVacanciesSlice, vacanciesActions } from './slice';
import {
  selectVacancies,
  selectVacanciesLoading,
  selectVacanciesError,
  selectVacanciesActionError,
  selectVacanciesActionSuccess,
} from './slice/selectors';
import {
  fetchVacancyApplications,
  fetchVacancyHiringMinute,
} from './api';
import {
  publishJobPosting,
  createJobPosting,
  withdrawJobPosting,
} from './jobPostingApi';
import { useAuth } from '@/hooks/useAuth';

export const VacancyHub: React.FC = () => {
  useVacanciesSlice();
  useRecruitmentRequestsSlice();
  const dispatch = useAppDispatch();
  const vacancies = useAppSelector(selectVacancies);
  const loading = useAppSelector(selectVacanciesLoading);
  const error = useAppSelector(selectVacanciesError);
  const actionError = useAppSelector(selectVacanciesActionError);
  const actionSuccess = useAppSelector(selectVacanciesActionSuccess);
  const recruitmentRequests = useAppSelector(selectRecruitmentRequests);
  const {
    workforcePlans,
    applications,
    interviews,
    jobTemplates,
    jobOffers,
    currentRole,
    vacancyHubView,
    selectedVacancyId,
    setVacancyHubView,
    setSelectedVacancyId,
    saveJobTemplate,
    addVacancyNote,
  } = useApp();
  const { toast } = useToast();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const companyName = authUser?.organizationName ?? '';
  const canRead = can(PERMISSIONS.VACANCY_READ);
  const canCreate = can(PERMISSIONS.VACANCY_CREATE);
  const canUpdate = can(PERMISSIONS.VACANCY_UPDATE);
  const canPublish = can(PERMISSIONS.VACANCY_PUBLISH);
  const canManagePosting = canUpdate || canPublish;
  const canClose = can(PERMISSIONS.VACANCY_CLOSE);
  const canManageStatus = canCreate || canUpdate;
  const navigate = useNavigate();
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const location = useLocation();

  useEffect(() => {
    if (vacancyId) {
      if (selectedVacancyId !== vacancyId) {
        setSelectedVacancyId(vacancyId);
      }
      // if (vacancyHubView !== 'detail') {
      //   setVacancyHubView('detail');
      // }
       if (vacancyHubView === 'list') {
        setVacancyHubView('detail');
      }
    } else if (location.pathname === '/dashboard/vacancies' || location.pathname === '/dashboard/vacancies/') {
      // If we navigated back to base vacancies path, clear details
      if (selectedVacancyId) {
        setSelectedVacancyId(null);
      }
      if (vacancyHubView === 'detail') {
        setVacancyHubView('list');
      }
    }
  }, [vacancyId, selectedVacancyId, vacancyHubView, location.pathname, setSelectedVacancyId, setVacancyHubView]);

  const canCancel = canManageStatus;

  const departments = useMemo<string[]>(
    () => [...new Set(vacancies.map((v) => v.departmentName))],
    [vacancies],
  );
  const getResolvedHiringManager = (vacancy: Vacancy) => {
    const linkedRequest = recruitmentRequests.find(
      (request) => request.id === vacancy.recruitmentRequestId,
    );

    return {
      id: vacancy.hiringManagerId || linkedRequest?.hiringManagerId || '',
      name:
        vacancy.hiringManagerName && vacancy.hiringManagerName !== 'TBD'
          ? vacancy.hiringManagerName
          : linkedRequest?.hiringManagerName || 'Unassigned',
    };
  };
  const hiringManagers = useMemo<[string, string][]>(
    () => [
      ...new Map(
        vacancies.map((v) => {
          const manager = getResolvedHiringManager(v);
          return [manager.id, manager.name];
        }),
      ).entries(),
    ],
    [vacancies, recruitmentRequests],
  );

  const [hubTab, setHubTab] = useState<'vacancies' | 'create'>('vacancies');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [hmFilter, setHmFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<
    'all' | 'closing_30' | 'overdue'
  >('all');
  const [search, setSearch] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');

  const selectedRequest = selectedRequestId
    ? recruitmentRequests.find((x) => x.id === selectedRequestId)
    : null;

  const [manualTitle, setManualTitle] = useState('');
  const [manualDept, setManualDept] = useState(departments[0] || 'General');
  const [currentTime] = useState(() => Date.now());

  // ── Job Posting API state ──────────────────────────────────────────────────
  // Real posting loaded from backend; null = not yet fetched or vacancy has none
  const [postingState, setPostingState] = useState<JobPosting | null>(null);
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingError, setPostingError] = useState<string | null>(null);
  // Track which vacancyId the current postingState belongs to
  const loadedForVacancyId = useRef<string | null>(null);

  // ── Vacancy-specific applications state ─────────────────────────────────────
  const [vacancyApplications, setVacancyApplications] = useState<Application[]>([]);

  const mapVacancyStatusToPublicationStatus = (
    status: Vacancy['vacancyStatus'],
  ): PublicationStatus => {
    if (status === 'published') return 'published';
    if (status === 'withdrawn') return 'withdrawn';
    if (status === 'closed') return 'closed';
    if (status === 'expired') return 'expired';
    return 'draft';
  };

  // Fallback local posting used only while the API is loading or for preview
  const buildLocalPosting = (vacancy: Vacancy): JobPosting => ({
    id: `posting-${vacancy.id}`,
    organizationId: vacancy.organizationId,
    vacancyId: vacancy.id,
    postingTitle: vacancy.title,
    postingDescription: vacancy.description,
    publicationStatus: mapVacancyStatusToPublicationStatus(vacancy.vacancyStatus),
    visibility: 'both',
    internalPosting: true,
    externalPosting: true,
    publishDate: vacancy.publishedAt,
    scheduledPublishDate: undefined,
    expiryDate: undefined,
    closingDate: vacancy.closingDate,
    channels: [],
    views: 0,
    applicationsCount: 0,
    requiresHrApproval: false,
    approvedBy: undefined,
    approvedByName: undefined,
    approvedAt: vacancy.publishedAt,
    createdBy: vacancy.createdBy,
    createdByName: vacancy.createdBy,
    createdAt: vacancy.createdAt,
    updatedAt: vacancy.updatedAt,
    publicationHistory: [],
  });

  /** Load real postings from the backend for the given vacancy.
   * Sets loadedForVacancyId.current BEFORE the await so that even a 500
   * error doesn't cause an infinite retry loop on re-render. */
  const loadPostingForVacancy = useCallback(async (vacancy: Vacancy) => {
    if (loadedForVacancyId.current === vacancy.id) return;
    // Mark as loaded FIRST — prevents re-entry even if the request fails
    loadedForVacancyId.current = vacancy.id;
    setPostingLoading(true);
    setPostingError(null);
    try {
      // TODO: Implement fetchJobPostingsByVacancy in api.ts
      const postings: any[] = [];
      if (postings.length > 0) {
        setPostingState(postings[0]);
      } else {
        // No posting exists yet — null tells JobPostingControl to show create prompt
        setPostingState(null);
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to load job posting';
      setPostingError(msg);
      // Use a local fallback so the UI still renders — do NOT retry automatically
      setPostingState(buildLocalPosting(vacancy));
    } finally {
      setPostingLoading(false);
    }
  }, []);

  const selectedVacancy = vacancies.find((v) => v.id === selectedVacancyId);

  const stableDispatch = useAppDispatch();
  useEffect(() => {
    stableDispatch(recruitmentRequestsActions.fetchRequestsRequest());
  }, [stableDispatch]);

  useEffect(() => {
    if (!selectedVacancy) {
      setPostingState(null);
      loadedForVacancyId.current = null;
      return;
    }
    // When the vacancy changes, reset so the next posting view will re-fetch
    if (loadedForVacancyId.current !== selectedVacancy.id) {
      setPostingState(null);
      loadedForVacancyId.current = null;
    }
  }, [selectedVacancy?.id]);

  // Load job posting from backend when entering the posting view
  // TODO: Re-enable when fetchJobPostingsByVacancy is implemented
  /*
  useEffect(() => {
    if (vacancyHubView === 'posting' && selectedVacancy) {
      loadPostingForVacancy(selectedVacancy);
    }
  }, [vacancyHubView, selectedVacancy?.id]);
  */

  // Load applications for the selected vacancy when entering detail view
  useEffect(() => {
    if (vacancyHubView === 'detail' && selectedVacancyId && canRead) {
      fetchVacancyApplications(selectedVacancyId)
        .then((apps) => {
          if (!Array.isArray(apps) || apps.length === 0) {
            setVacancyApplications([]);
            return;
          }
          const mapStatus = (status: string): Application['applicationStatus'] => {
            const s = String(status).toUpperCase();
            switch (s) {
              case 'SUBMITTED': return 'submitted';
              case 'UNDER_SCREENING': return 'screening';
              case 'SHORTLISTED': return 'shortlisted';
              case 'INTERVIEW_SCHEDULED':
              case 'INTERVIEW_COMPLETED': return 'interview';
              case 'UNDER_EVALUATION': return 'interview';
              case 'SELECTED': return 'hired';
              case 'OFFER_ISSUED':
              case 'OFFER_ACCEPTED': return 'offered';
              case 'OFFER_DECLINED': return 'rejected';
              case 'REJECTED': return 'rejected';
              case 'MOVED_TO_TALENT_ROSTER': return 'shortlisted';
              default: return 'submitted';
            }
          };

          const mapCurrentStage = (status: string): string => {
            const s = String(status).toUpperCase();
            switch (s) {
              case 'SUBMITTED': return 'Screening Queue';
              case 'UNDER_SCREENING': return 'Screening';
              case 'SHORTLISTED': return 'Shortlisted';
              case 'INTERVIEW_SCHEDULED': return 'Interview Scheduled';
              case 'INTERVIEW_COMPLETED': return 'Interview Completed';
              case 'UNDER_EVALUATION': return 'Under Evaluation';
              case 'SELECTED': return 'Selected';
              case 'OFFER_ISSUED': return 'Offer Issued';
              case 'OFFER_ACCEPTED': return 'Offer Accepted';
              case 'OFFER_DECLINED': return 'Offer Declined';
              case 'REJECTED': return 'Rejected';
              case 'MOVED_TO_TALENT_ROSTER': return 'Talent Roster';
              default: return 'Screening Queue';
            }
          };

          const mappedApps: Application[] = apps.map((app: any) => ({
            id: app.id,
            organizationId: String(app.company_id),
            candidateId: app.candidate_id,
            candidateName: app.candidate 
              ? `${app.candidate.first_name} ${app.candidate.last_name}`
              : 'Candidate',
            candidateEmail: app.candidate?.email || '',
            vacancyId: app.vacancy_id,
            vacancyTitle: selectedVacancy?.title || '',
            applicationSource: 'Company Website',
            applicationStatus: mapStatus(app.status),
            currentStage: mapCurrentStage(app.status),
            coverLetter: app.cover_letter || '',
            submittedAt: app.submitted_at || app.created_at,
            matchScore: 0,
            screeningComments: app.notes || undefined,
            rejectionReason: app.rejection_reason || undefined,
            evaluationScore: undefined,
          }));
          setVacancyApplications(mappedApps);
        })
        .catch((err) => {
          console.error('Failed to fetch applications:', err);
          setVacancyApplications([]);
        });
    }
  }, [vacancyHubView, selectedVacancyId, canRead, selectedVacancy?.title]);

  const selectedPosting = postingState;

  useEffect(() => {
    if (!canRead) return;
    stableDispatch(vacanciesActions.fetchVacanciesRequest());
  }, [stableDispatch, canRead]);

  useEffect(() => {
    if (error) toast(error, 'error');
  }, [error, toast]);

  useEffect(() => {
    if (actionError) {
      toast(actionError, 'error');
      stableDispatch(vacanciesActions.clearActionStatus());
    }
  }, [actionError, toast, stableDispatch]);

  useEffect(() => {
    if (actionSuccess) {
      toast(actionSuccess, 'success');
      stableDispatch(vacanciesActions.clearActionStatus());
    }
  }, [actionSuccess, toast, stableDispatch]);

  // Auto-close overdue vacancies
  useEffect(() => {
    const now = new Date();
    vacancies.forEach((vacancy) => {
      if (
        ['open', 'published', 'in_progress'].includes(vacancy.vacancyStatus) &&
        vacancy.closingDate
      ) {
        const closingDate = new Date(vacancy.closingDate);
        if (closingDate < now) {
          dispatch(
            vacanciesActions.closeVacancyRequest(vacancy.id),
          );
        }
      }
    });
  }, [vacancies, dispatch]);

  const buildVacancyDisplayCode = (index: number, id: string) =>
    `VAC-${String(index + 1).padStart(3, '0')}-${id.slice(0, 6).toUpperCase()}`;

  const buildVacancyDraftFromRequest = (
    request: RecruitmentRequest,
  ): Vacancy => {
    const now = new Date();
    const closing = new Date(now);
    closing.setDate(closing.getDate() + 90);
    const id = `vac-${Date.now()}`;
    const displayCode = buildVacancyDisplayCode(vacancies.length, id);

    return {
      id,
      displayCode,
      organizationId: request.organizationId,
      recruitmentRequestId: request.id,
      recruitmentRequestReference: request.referenceCode,
      workforcePlanId: request.workforcePlanId,
      workforcePlanReference: request.workforcePlanReference,
      jobTemplateId: request.jobTemplateId,
      title: request.jobTitle,
      departmentId: request.departmentId,
      departmentName: request.departmentName,
      location: request.location || 'Headquarters',
      employmentType: request.employmentType,
      vacancyStatus: 'draft',
      openPositions: request.numberOfOpenings || 1,
      salaryMin: request.salaryMin,
      salaryMax: request.salaryMax,
      description: request.jobDescription || '',
      responsibilities:
        request.requiredSkills?.length > 0
          ? request.requiredSkills.map((skill) => `• ${skill}`).join('\n')
          : 'Define key responsibilities.',
      requirements: request.experienceYears
        ? `${request.experienceYears}+ years experience`
        : 'Define candidate requirements.',
      skills: request.requiredSkills || [],
      benefits: '',
      employmentTerms: '',
      experienceRequired: request.experienceYears
        ? `${request.experienceYears}+ years`
        : '',
      closingDate: closing.toISOString().slice(0, 10),
      hiringManagerId: request.hiringManagerId,
      hiringManagerName: request.hiringManagerName,
      ownerId: 'system',
      ownerName: 'Talent Team',
      isUrgent: request.requestType === 'unplanned',
      createdBy: 'system',
      lastModifiedBy: 'system',
      lastModifiedByName: 'Talent Team',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      channels: [],
      activities: [],
      statusHistory: [],
      notes: [],
    };
  };

  const buildManualVacancyDraft = (
    title: string,
    departmentName: string,
  ): Vacancy => {
    const now = new Date();
    const closing = new Date(now);
    closing.setDate(closing.getDate() + 90);
    const id = `vac-${Date.now()}`;
    const displayCode = buildVacancyDisplayCode(vacancies.length, id);

    return {
      id,
      displayCode,
      organizationId: 'org-1',
      recruitmentRequestId: '',
      title: title || 'New vacancy',
      departmentId: `dept-${departmentName.toLowerCase().replace(/\s+/g, '-')}`,
      departmentName: departmentName || 'General',
      location: 'Headquarters',
      employmentType: 'full_time',
      vacancyStatus: 'draft',
      openPositions: 1,
      salaryMin: undefined,
      salaryMax: undefined,
      description: '',
      responsibilities: '',
      requirements: '',
      skills: [],
      benefits: '',
      employmentTerms: '',
      experienceRequired: '',
      closingDate: closing.toISOString().slice(0, 10),
      hiringManagerId: '',
      hiringManagerName: '',
      ownerId: 'system',
      ownerName: 'Talent Team',
      isUrgent: false,
      createdBy: 'system',
      lastModifiedBy: 'system',
      lastModifiedByName: 'Talent Team',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      channels: [],
      activities: [],
      statusHistory: [],
      notes: [],
    };
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedRequestId) return;
    const vacancy = buildVacancyDraftFromRequest(selectedRequest);
    dispatch(vacanciesActions.createVacancyRequest(vacancy));
    setHubTab('vacancies');
    setVacancyHubView('list');
    setSelectedRequestId('');
  };

  const handlePostVacancy = (vacancyId: string) => {
    dispatch(vacanciesActions.postVacancyRequest(vacancyId));
  };

  const ensurePostingLoaded = (vacancy: Vacancy) => {
    loadPostingForVacancy(vacancy);
  };

  const handlePublishVacancy = async (channelIds: string[] = []) => {
    if (!selectedVacancy) return;
    setPostingLoading(true);
    try {
      const updated = await publishJobPosting(selectedVacancy.id, channelIds);
      setPostingState(updated);
      loadedForVacancyId.current = selectedVacancy.id;
      // Also mark the vacancy itself as published in Redux state
      dispatch(vacanciesActions.postVacancyRequest(selectedVacancy.id));
      toast('Job posting published successfully.', 'success');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to publish posting', 'error');
    } finally {
      setPostingLoading(false);
    }
  };

  const handleCreateAndPublish = async (channelIds: string[]) => {
    if (!selectedVacancy) return;
    if (channelIds.length === 0) {
      toast('Please select at least one channel before publishing.', 'error');
      return;
    }
    setPostingLoading(true);
    try {
      const newPosting = await createJobPosting(selectedVacancy.id, channelIds);
      setPostingState(newPosting);
      loadedForVacancyId.current = selectedVacancy.id;
      // Sync vacancy status to OPEN/PUBLISHED in Redux
      dispatch(vacanciesActions.postVacancyRequest(selectedVacancy.id));
      toast('Job posting created and published.', 'success');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to create posting', 'error');
    } finally {
      setPostingLoading(false);
    }
  };

  const handleApproveVacancyPosting = (notes?: string) => {
    if (!selectedVacancy) return;
    dispatch(
      vacanciesActions.approveVacancyPostingRequest({
        vacancyId: selectedVacancy.id,
        notes,
      }),
    );
  };

  const handleRejectVacancyPosting = (reason: string) => {
    if (!selectedVacancy) return;
    dispatch(
      vacanciesActions.rejectVacancyPostingRequest({
        vacancyId: selectedVacancy.id,
        reason,
      }),
    );
  };

  const handleUpdatePostingChannels = (enabledSlugs: string[]) => {
    setPostingState((prev) =>
      prev
        ? {
            ...prev,
            channels: prev.channels.map((channel) => ({
              ...channel,
              enabled: enabledSlugs.includes(channel.channelSlug),
            })),
          }
        : prev,
    );
  };

  const handleUpdatePostingVisibility = (visibility: PostingVisibility) => {
    setPostingState((prev) =>
      prev
        ? {
            ...prev,
            visibility,
            internalPosting: visibility !== 'external_only',
            externalPosting: visibility !== 'internal_only',
          }
        : prev,
    );
  };

  const handleUpdatePostingClosingDate = (date: string) => {
    setPostingState((prev) =>
      prev ? { ...prev, closingDate: date, expiryDate: date } : prev,
    );
  };

  const handleSchedulePosting = (date: string, time: string) => {
    setPostingState((prev) =>
      prev
        ? {
            ...prev,
            scheduledPublishDate: `${date}T${time}:00.000Z`,
          }
        : prev,
    );
  };

  const handleWithdrawPosting = async () => {
    if (!selectedVacancy) return;
    setPostingLoading(true);
    try {
      const updated = await withdrawJobPosting(selectedVacancy.id);
      setPostingState(updated);
      // Re-fetch vacancies so Redux reflects the new OPEN status
      dispatch(vacanciesActions.fetchVacanciesRequest());
      toast('Job posting withdrawn.', 'success');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to withdraw posting', 'error');
    } finally {
      setPostingLoading(false);
    }
  };

  const handleUnpublishPosting = () => {
    setPostingState((prev) =>
      prev ? { ...prev, publicationStatus: 'draft' } : prev,
    );
  };

  const handleDuplicatePosting = () => {
    if (!postingState) return;
    setPostingState((prev) =>
      prev
        ? {
            ...prev,
            id: `${prev.id}-copy`,
            postingTitle: `${prev.postingTitle} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : prev,
    );
  };

  const handleSavePostingDraft = () => {
    if (!selectedVacancy || !postingState) return;
    dispatch(
      vacanciesActions.updateVacancyRequest({
        vacancyId: selectedVacancy.id,
        payload: {
          closingDate: postingState.closingDate,
          vacancyStatus: 'draft',
        },
      }),
    );
    toast('Job posting draft saved.');
  };

  const handleSubmitPostingForApproval = (channelIds: string[] = []) => {
    handlePublishVacancy(channelIds);
  };

  const filteredVacancies = vacancies.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.displayCode.toLowerCase().includes(q) ||
      v.departmentName.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' || v.vacancyStatus === statusFilter;
    const matchDept = deptFilter === 'all' || v.departmentName === deptFilter;
    const resolvedHiringManager = getResolvedHiringManager(v);
    const matchHm =
      hmFilter === 'all' || resolvedHiringManager.id === hmFilter;

    const daysToClose = v.closingDate
      ? (new Date(v.closingDate).getTime() - currentTime) /
        (1000 * 60 * 60 * 24)
      : null;

    const matchDate =
      dateFilter === 'all' ||
      (dateFilter === 'closing_30' &&
        daysToClose != null &&
        daysToClose >= 0 &&
        daysToClose <= 30) ||
      (dateFilter === 'overdue' && daysToClose != null && daysToClose < 0);

    return matchSearch && matchStatus && matchDept && matchHm && matchDate;
  });

  const openVacancies = vacancies.filter((v) =>
    ['open', 'published', 'in_progress', 'on_hold'].includes(
      v.vacancyStatus,
    ),
  );
  const deptStats = aggregateByDepartment(vacancies);
  const avgTtf = averageTimeToFillDays(vacancies, jobOffers);
  const urgentCount = vacancies.filter(isUrgentVacancy).length;

  const maxDeptCount = Math.max(...deptStats.map((d) => d.count), 1);

  if (vacancyHubView === 'editor' && selectedVacancy) {
    return (
      <JobDescriptionEditor
        vacancy={selectedVacancy}
        templates={jobTemplates}
        onBack={() => setVacancyHubView('detail')}
        onChange={(form) =>
          dispatch(
            vacanciesActions.updateVacancyJobContent({
              vacancyId: selectedVacancy.id,
              form,
            }),
          )
        }
        onSave={(form) => {
          dispatch(
            vacanciesActions.updateVacancyRequest({
              vacancyId: selectedVacancy.id,
              payload: {
                title: form.title,
                description: form.description,
                responsibilities: form.responsibilities,
                requirements: form.requirements,
                required_qualifications: form.requirements,
                // Parse "5+ years" → 5 for required_experience
                required_experience: form.experienceRequired
                  ? Number(form.experienceRequired.match(/\d+/)?.[0] ?? 0) || undefined
                  : undefined,
                // Store additional fields in a format that can be parsed back
                // We'll store them as JSON in a custom field or combine with existing fields
                benefits: form.benefits,
                employmentTerms: form.employmentTerms,
                skills: form.skills,
                experienceRequired: form.experienceRequired,
              } as any,
            }),
          );
          dispatch(
            vacanciesActions.updateVacancyJobContent({
              vacancyId: selectedVacancy.id,
              form,
            }),
          );
          toast('Job description saved.');
        }}
        onSaveAsTemplate={(form, name) => saveJobTemplate(form, name)}
        onApplyTemplate={(id) => {
          const template = jobTemplates.find((tmpl) => tmpl.id === id);
          if (!template) return;
          dispatch(
            vacanciesActions.updateVacancyJobContent({
              vacancyId: selectedVacancy.id,
              form: {
                title: template.title,
                description: template.description,
                responsibilities: template.responsibilities,
                requirements: template.requirements,
                skills: template.skills,
                benefits: template.benefits || '',
                employmentTerms: template.employmentTerms || '',
                experienceRequired: template.experienceRequired || '',
              },
            }),
          );
        }}
        onPreview={() => setVacancyHubView('preview')}
        onContinueToPosting={() => {
          ensurePostingLoaded(selectedVacancy);
          setVacancyHubView('posting');
        }}
      />
    );
  }

  if (vacancyHubView === 'preview' && selectedVacancy) {
    const previewPosting =
      selectedPosting || buildLocalPosting(selectedVacancy);
    return (
      <JobPreviewPage
        vacancy={selectedVacancy}
        posting={previewPosting}
        companyName={companyName}
        mode={
          previewPosting?.visibility === 'internal_only'
            ? 'internal'
            : 'external'
        }
        onBack={() => setVacancyHubView('editor')}
        onEdit={() => setVacancyHubView('editor')}
        onContinueToPosting={() => {
          ensurePostingLoaded(selectedVacancy);
          setVacancyHubView('posting');
        }}
      />
    );
  }

  if (vacancyHubView === 'posting' && selectedVacancy) {
    const posting = selectedPosting || buildLocalPosting(selectedVacancy);
    return (
      <JobPostingControl
        vacancy={selectedVacancy}
        posting={posting}
        postingLoading={postingLoading}
        postingError={postingError}
        hasRealPosting={!!postingState && !postingState.id.startsWith('posting-')}
        currentRole={currentRole}
        onUpdateChannels={handleUpdatePostingChannels}
        onUpdateVisibility={handleUpdatePostingVisibility}
        onUpdateClosingDate={handleUpdatePostingClosingDate}
        onPublish={(channelIds) => handlePublishVacancy(channelIds)}
        onSchedule={handleSchedulePosting}
        onWithdraw={handleWithdrawPosting}
        onUnpublish={handleUnpublishPosting}
        onDuplicate={handleDuplicatePosting}
        onSaveDraft={handleSavePostingDraft}
        onSubmitForApproval={() => handlePublishVacancy([])}        onApprove={handleApproveVacancyPosting}
        onReject={handleRejectVacancyPosting}
        onCreatePosting={handleCreateAndPublish}
        onPauseHiring={() => {
          if (canManagePosting) {
            dispatch(vacanciesActions.holdVacancyRequest(selectedVacancy.id));
          }
        }}
        onResumeHiring={() => {
          if (canManagePosting) {
            dispatch(vacanciesActions.resumeVacancyRequest(selectedVacancy.id));
          }
        }}
        onBack={() => setVacancyHubView('detail')}
        canPublishVacancy={canManagePosting}
        canManagePosting={canManagePosting}
        canCloseVacancy={canClose}
      />
    );
  }

  if (vacancyHubView === 'detail' && selectedVacancy) {
    const req = recruitmentRequests.find(
      (r) => r.id === selectedVacancy.recruitmentRequestId,
    );
    const plan = workforcePlans.find(
      (w) => String(w.id) === String(selectedVacancy.workforcePlanId),
    );
    return (
      <VacancyManagementDetail
        vacancy={selectedVacancy}
        posting={selectedPosting ?? undefined}
        request={req}
        workforcePlan={plan}
        applications={vacancyApplications}
        interviews={interviews}
        onEditDescription={() => {
          if (canUpdate) setVacancyHubView('editor');
        }}
        onManagePosting={() => {
          if (!canManagePosting) return;
          ensurePostingLoaded(selectedVacancy);
          setVacancyHubView('posting');
        }}
        onPutOnHold={() => {
          if (canUpdate) {
            dispatch(vacanciesActions.holdVacancyRequest(selectedVacancy.id));
          }
        }}
        onResume={() => {
          if (canUpdate) {
            dispatch(vacanciesActions.resumeVacancyRequest(selectedVacancy.id));
          }
        }}
        onTransitionStatus={(status) => {
          if (status === 'on_hold') {
            if (canUpdate) {
              dispatch(vacanciesActions.holdVacancyRequest(selectedVacancy.id));
            }
            return;
          }
          if (status === 'open' && selectedVacancy.vacancyStatus === 'on_hold') {
            if (canUpdate) {
              dispatch(vacanciesActions.resumeVacancyRequest(selectedVacancy.id));
            }
            return;
          }
          if (status === 'closed' || status === 'filled') {
            if (canClose) {
              dispatch(vacanciesActions.closeVacancyRequest(selectedVacancy.id));
            }
            return;
          }
          if (status === 'in_progress') {
            if (canManageStatus) {
              dispatch(
                vacanciesActions.setVacancyStatusRequest({
                  vacancyId: selectedVacancy.id,
                  status: 'IN_PROGRESS',
                }),
              );
            }
            return;
          }
          if (status === 'cancelled') {
            if (canCancel) {
              dispatch(
                vacanciesActions.setVacancyStatusRequest({
                  vacancyId: selectedVacancy.id,
                  status: 'CANCELLED',
                }),
              );
            }
            return;
          }
          if (status === 'open') {
            if (canManageStatus) {
              dispatch(
                vacanciesActions.setVacancyStatusRequest({
                  vacancyId: selectedVacancy.id,
                  status: 'OPEN',
                }),
              );
            }
          }
        }}
        onUpdateMeta={(updates) => {
          console.log('onUpdateMeta called with updates:', updates);
          dispatch(
            vacanciesActions.updateVacancyRequest({
              vacancyId: selectedVacancy.id,
              payload: updates,
            }),
          );
        }}
        onAddNote={(body) => addVacancyNote(selectedVacancy.id, body)}
        onBack={() => {
          setVacancyHubView('list');
          setSelectedVacancyId(null);
          navigate('/dashboard/vacancies');
        }}
        canUpdate={canUpdate}
        canManageStatus={canManageStatus}
        canCancel={canCancel}
        canPublish={canManagePosting}
        canClose={canClose}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-6   sm:px-6 lg:px-8 ">
      <PageSectionHeader
        eyebrow="Recruitment"
        title="Vacancies"
        description="Manage openings, job descriptions, and postings"
        action={
          canCreate ? (
          <button
            type="button"
            onClick={() => {
              setVacancyHubView('list');
              setHubTab(hubTab === 'create' ? 'vacancies' : 'create');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200/80"
          >
            <span className="material-symbols-outlined text-base">
              {hubTab === 'create' ? 'arrow_back' : 'add'}
            </span>
            {hubTab === 'create' ? 'Back to vacancies' : 'Create vacancy'}
          </button>
          ) : undefined
        }
      />

      

      <VacancyHubMetrics
        openVacancies={openVacancies.length}
        avgTtf={avgTtf ? `${avgTtf}d` : '—'}
        urgentCount={urgentCount}
        inProgressCount={
          vacancies.filter((v) => v.vacancyStatus === 'in_progress').length
        }
        publishedCount={
          vacancies.filter((v) => v.vacancyStatus === 'published').length
        }
      />

    

      {hubTab === 'vacancies' ? (
        <VacancyHubListView
          filteredVacancies={filteredVacancies}
          search={search}
          statusFilter={statusFilter}
          deptFilter={deptFilter}
          hmFilter={hmFilter}
          dateFilter={dateFilter}
          departments={departments}
          hiringManagers={hiringManagers}
          recruitmentRequests={recruitmentRequests}
          applications={applications}
          setSearch={setSearch}
          setStatusFilter={setStatusFilter}
          setDeptFilter={setDeptFilter}
          setHmFilter={setHmFilter}
          setDateFilter={setDateFilter}
          onSelectVacancyDetail={(id) => {
            setSelectedVacancyId(id);
            setVacancyHubView('detail');
            navigate(`/dashboard/vacancies/${id}`);
          }}
          onEditVacancy={(id) => {
            setSelectedVacancyId(id);
            setVacancyHubView('editor');
          }}
          onPostVacancy={handlePostVacancy}
        />
      ) : (
        <VacancyHubCreateView
          canCreate={canCreate}
          manualTitle={manualTitle}
          manualDept={manualDept}
          departments={departments}
          recruitmentRequests={recruitmentRequests}
          vacancies={vacancies}
          selectedRequestId={selectedRequestId}
          selectedRequest={selectedRequest}
          onSelectedRequestChange={setSelectedRequestId}
          onCreateDraft={handleCreateDraft}
          onManualTitleChange={setManualTitle}
          onManualDeptChange={setManualDept}
          onCreateEmptyDraft={() => {
            const vacancy = buildManualVacancyDraft(
              manualTitle || 'New vacancy',
              manualDept,
            );
            dispatch(vacanciesActions.createVacancyRequest(vacancy));
            setHubTab('vacancies');
            setVacancyHubView('list');
          }}
        />
      )}
    </div>
  );
};
