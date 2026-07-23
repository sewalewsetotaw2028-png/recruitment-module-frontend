import type {
  Application,
  Interview,
  RecruitmentRequest,
  Vacancy,
  WorkforcePlan,
  WorkforcePlanFormPayload,
} from '@/types';
export const normalizeEmploymentTypeForApi = (value: string) => {
  const normalized = value?.toString().toLowerCase() || '';
  if (normalized.includes('full')) return 'full_time';
  if (normalized.includes('part')) return 'part_time';
  if (normalized.includes('contract')) return 'contract';
  if (normalized.includes('intern')) return 'internship';
  return normalized || 'full_time';
};

const normalizeStatus = (value: unknown) => String(value ?? '').toLowerCase();

const mapApplicationStatusForUi = (
  value: unknown,
): Application['applicationStatus'] => {
  const status = normalizeStatus(value);
  switch (status) {
    case 'draft':
    case 'submitted':
      return 'SUBMITTED';
    case 'under_screening':
    case 'screening':
      return 'UNDER_SCREENING';
    case 'shortlisted':
      return 'SHORTLISTED';
    case 'interview_scheduled':
    case 'interview_completed':
      return 'INTERVIEW_COMPLETED';
    case 'under_evaluation':
      return 'UNDER_EVALUATION';
    case 'selected':
      return 'SELECTED';
    case 'offer_issued':
      return 'OFFER_ISSUED';
    case 'offered':
      return 'OFFER_ISSUED';
    case 'offer_accepted':
      return 'OFFER_ACCEPTED';
    case 'hired':
      return 'OFFER_ACCEPTED';
    case 'offer_declined':
      return 'OFFER_DECLINED';
    case 'rejected':
      return 'REJECTED';
    case 'moved_to_talent_roster':
      return 'MOVED_TO_TALENT_ROSTER';
    default:
      return 'SUBMITTED';
  }
};

const mapInterviewStatusForUi = (value: unknown): Interview['interviewStatus'] => {
  const status = normalizeStatus(value);
  switch (status) {
    case 'scheduled':
    case 'rescheduled':
      return status;
    case 'completed':
    case 'finalized':
    case 'evaluation_pending':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'scheduled';
  }
};

export const mapBackendRecruitmentRequest = (raw: any): RecruitmentRequest => {
  const status =
    normalizeStatus(raw.status) === 'draft'
      ? 'draft'
      : normalizeStatus(raw.status) === 'pending' ||
          normalizeStatus(raw.status) === 'submitted'
        ? 'submitted'
      : normalizeStatus(raw.status) === 'pending_ceo' ||
            normalizeStatus(raw.status) === 'under_review'
          ? 'pending_ceo'
          : normalizeStatus(raw.status) === 'approved'
            ? 'approved'
            : normalizeStatus(raw.status) === 'rejected'
              ? 'rejected'
              : 'submitted';
  const priority = raw.priority
    ? raw.priority.toString().toLowerCase()
    : 'medium';
  const requestedByName = raw.requested_by
    ? `${raw.requested_by.first_name} ${raw.requested_by.last_name}`
    : '';
  return {
    id: raw.id,
    organizationId: raw.company_id,
    referenceCode:
      raw.reference_code || `REQ-${raw.id?.slice(-6).toUpperCase()}`,
    workforcePlanId: raw.workforce_plan_item?.workforce_plan?.id ||
      raw.workforce_plan_item?.workforce_plan_id ||
      raw.workforce_plan_item_id || undefined,
    workforcePlanItemId: raw.workforce_plan_item_id || undefined,
    workforcePlanReference: raw.workforce_plan_reference ||
      raw.workforce_plan_item?.workforce_plan?.title || undefined,
    requestTitle:
      raw.position_name ||
      raw.job_title ||
      raw.request_title ||
      'Recruitment request',
    requestedBy: raw.requested_by_user_id || '',
    requestedByName,
    hiringManagerId:
      raw.custom_field_values?.__hiring_manager_id ||
      raw.workforce_plan_item?.department?.manager?.id ||
      raw.workforce_plan_item?.workforce_plan?.created_by?.id ||
      raw.workforce_plan_item?.workforce_plan?.created_by_user_id ||
      raw.hiringManagerId ||
      '',
    hiringManagerName: (() => {
      const storedName = raw.custom_field_values?.__hiring_manager_name;
      if (storedName) return storedName;

      const manager = raw.workforce_plan_item?.department?.manager;
      if (manager?.first_name) {
        return `${manager.first_name} ${manager.last_name}`.trim();
      }

      const planCreator = raw.workforce_plan_item?.workforce_plan?.created_by;
      if (planCreator?.first_name) {
        return `${planCreator.first_name} ${planCreator.last_name}`.trim();
      }

      return raw.hiringManagerName || '';
    })(),
    departmentId: raw.department_id || '',
    departmentName:
      raw.department?.name ||
      raw.department_name ||
      raw.departmentName ||
      'General',
    jobTitle: raw.job_title || raw.position_name || raw.request_title || '',
    grade: raw.grade || '',
    priority:
      priority === 'high' ? 'High' : priority === 'low' ? 'Low' : 'Medium',
    employmentType: normalizeEmploymentTypeForApi(raw.employment_type) as
      | 'full_time'
      | 'part_time'
      | 'contractor',
    numberOfOpenings: raw.headcount || 1,
    location:
      raw.custom_field_values?.__location ||
      raw.workforce_plan_item?.workforce_plan?.business_unit ||
      raw.location ||
      '',
    requestType:
      raw.request_type === 'planned' || raw.request_type === 'unplanned'
        ? raw.request_type
        : raw.is_replacement
          ? 'unplanned'
          : 'planned',
    isReplacement: Boolean(raw.is_replacement),
    replacementForEmployee: raw.replacement_for_employee_id || undefined,
    replacementEmployeeId: raw.replacement_for_employee_id || undefined,
    replacementReason: raw.replacement_reason || undefined,
    justification: raw.justification || '',
    supportingDocumentName: (() => {
      const comments = raw.hr_comments || '';
      // __doc:: tag format: __doc::storageUri::originalFilename  (stops at newline)
      const match = comments.match(/__doc::([^:]+(?::[^:]+)*)::([^\n]+)/);
      if (match) return match[2].trim();
      const fallback = raw.supporting_document_name || undefined;
      if (!fallback) return undefined;
      return String(fallback).split('/').pop() || fallback;
    })(),
    supportingDocumentUrl: (() => {
      const comments = raw.hr_comments || '';
      const match = comments.match(/__doc::([^:]+(?::[^:]+)*)::([^\n]+)/);
      if (match) return match[1].trim();
      return raw.supporting_document_name || undefined;
    })(),
    jobDescription: raw.job_description || '',
    requiredSkills: raw.required_skills || [],
    experienceYears: raw.experience_years || 0,
    salaryMin: raw.salary_min,
    salaryMax: raw.salary_max,
    reportingManager: raw.reporting_manager || undefined,
    jobTemplateId: raw.job_template_id || undefined,
    status,
    hrReviewedBy: raw.hr_reviewed_by || undefined,
    hrReviewedByName: raw.hr_reviewed_by_name || undefined,
    hrReviewDate: raw.hr_review_date || undefined,
    hrReviewNotes: (() => {
      // hr_comments may contain a __doc:: tag prefix and/or __ceo_notes:: — strip both, return HR notes
      const raw_comments = raw.hr_comments || raw.hr_review_notes || '';
      if (!raw_comments) return undefined;
      const stripped = raw_comments
        .replace(/__doc::[^\n]*\n?/, '')
        .replace(/__ceo_notes::[^\n]*\n?/, '')
        .trim();
      return stripped || undefined;
    })(),
    ceoApprovalNotes: (() => {
      const raw_comments = raw.hr_comments || '';
      if (!raw_comments) return undefined;
      const match = raw_comments.match(/__ceo_notes::([^\n]+)/);
      return match ? match[1].trim() : undefined;
    })(),
    approvedBy: raw.approved_by || undefined,
    approvedByName: raw.approved_by?.first_name
      ? `${raw.approved_by.first_name} ${raw.approved_by.last_name}`.trim()
      : raw.approved_by_name || undefined,
    approvedAt: raw.approved_at || undefined,
    rejectedBy: raw.rejected_by || undefined,
    rejectedByName: raw.rejected_by_name || undefined,
    rejectedAt: raw.rejected_at || undefined,
    rejectionReason: (() => {
      // Rejection reason is also stored in hr_comments when status is REJECTED
      const raw_comments = raw.hr_comments || raw.rejection_reason || '';
      if (!raw_comments) return undefined;
      const stripped = raw_comments.replace(/__doc::[^\n]*\n?/, '').trim();
      // Only return as rejection reason if the status is rejected
      if (stripped && (raw.status === 'REJECTED' || raw.status === 'rejected')) {
        return stripped;
      }
      return raw.rejection_reason || undefined;
    })(),
    linkedVacancyId: raw.linked_vacancy_id || undefined,
    customFieldValues:
      raw.custom_field_values || raw.customFieldValues || undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    revisions: raw.revisions || [],
    activities: raw.activities || [],
  };
};

export const mapBackendVacancy = (raw: any): Vacancy => ({
  id: raw.id,
  displayCode: raw.displayCode || `VAC-${raw.id?.slice(-6).toUpperCase()}`,
  organizationId: raw.organizationId,
  recruitmentRequestId: raw.recruitmentRequestId || '',
  recruitmentRequestReference: raw.recruitmentRequestReference || undefined,
  workforcePlanId: raw.workforcePlanId || undefined,
  workforcePlanReference: raw.workforcePlanReference || undefined,
  title: raw.title || '',
  departmentId: raw.departmentId || '',
  departmentName: raw.department?.name || raw.departmentName || 'General',
  location: raw.location || '',
  employmentType: normalizeEmploymentTypeForApi(raw.employmentType) as
    | 'full_time'
    | 'part_time'
    | 'contractor',
  vacancyStatus:
    normalizeStatus(raw.status) === 'open'
      ? 'open'
      : normalizeStatus(raw.status) === 'published'
        ? 'published'
        : normalizeStatus(raw.status) === 'filled'
          ? 'filled'
          : 'draft',
  openPositions: raw.openPositions || 1,
  salaryMin: raw.salaryMin,
  salaryMax: raw.salaryMax,
  description: raw.description || '',
  responsibilities: raw.responsibilities || '',
  requirements: raw.requirements || '',
  skills: raw.skills || [],
  benefits: raw.benefits || '',
  employmentTerms: raw.employmentTerms || '',
  experienceRequired: raw.requiredExperience
    ? `${raw.requiredExperience}+ years`
    : raw.experienceRequired || '',
  closingDate:
    raw.closingDate ||
    raw.postedAt?.slice(0, 10) ||
    new Date().toISOString().slice(0, 10),
  hiringManagerId: raw.hiringManagerId || '',
  hiringManagerName: raw.hiringManagerName || '',
  ownerId: raw.ownerId || '',
  ownerName: raw.ownerName || '',
  isUrgent: raw.isUrgent ?? false,
  createdBy: raw.createdBy || '',
  lastModifiedBy: raw.lastModifiedBy || '',
  lastModifiedByName: raw.lastModifiedByName || '',
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  channels: [],
  activities: [],
  statusHistory: [],
  notes: [],
});

export const mapBackendApplication = (raw: any): Application => ({
  id: raw.id,
  organizationId: raw.organizationId || raw.organization_id || raw.company_id,
  candidateId: raw.candidate?.id || raw.candidateId || raw.candidate_id || '',
  candidateName:
    raw.candidate?.firstName && raw.candidate?.lastName
      ? `${raw.candidate.firstName} ${raw.candidate.lastName}`
      : raw.candidate?.first_name && raw.candidate?.last_name
        ? `${raw.candidate.first_name} ${raw.candidate.last_name}`
        : raw.candidateName || 'Candidate',
  candidateEmail: raw.candidate?.email || raw.candidateEmail || raw.candidate_email || '',
  vacancyId: raw.vacancy?.id || raw.vacancyId || raw.vacancy_id || '',
  vacancyTitle: raw.vacancy?.title || raw.vacancyTitle || '',
  applicationSource: raw.applicationSource || raw.source || 'Company Website',
  applicationStatus: mapApplicationStatusForUi(raw.status || raw.applicationStatus),
  currentStage:
    raw.currentStage ||
    raw.current_stage ||
    (normalizeStatus(raw.status) === 'submitted'
      ? 'Screening Queue'
      : 'In progress'),
  coverLetter: raw.coverLetter || raw.coverLetterText || '',
  submittedAt:
    raw.submittedAt?.slice(0, 10) ||
    raw.submittedAt ||
    raw.submitted_at ||
    raw.createdAt ||
    new Date().toISOString(),
  matchScore: raw.matchScore ?? raw.match_score ?? 0,
  screeningComments: raw.screeningComments || raw.screening_comments || raw.notes || undefined,
  rejectionReason: raw.rejectionReason || raw.rejection_reason || undefined,
  evaluationScore: raw.evaluationScore ?? undefined,
});

export const mapBackendInterview = (raw: any): Interview => ({
  id: raw.id,
  organizationId: raw.organizationId,
  applicationId: raw.applicationId,
  candidateName:
    raw.application?.candidate?.firstName &&
    raw.application?.candidate?.lastName
      ? `${raw.application.candidate.firstName} ${raw.application.candidate.lastName}`
      : raw.candidateName || 'Candidate',
  vacancyTitle:
    raw.application?.vacancy?.title || raw.vacancyTitle || 'Interview',
  interviewRound: raw.round || raw.interviewRound || 1,
  interviewType:
    raw.type === 'inperson'
      ? 'physical'
      : raw.type === 'hybrid'
        ? 'hybrid'
        : 'virtual',
  scheduledStart:
    raw.startTime || raw.scheduledStart || new Date().toISOString(),
  scheduledEnd: raw.endTime || raw.scheduledEnd || new Date().toISOString(),
  location: raw.officeLocation || raw.location || undefined,
  meetingLink: raw.meetingLink || undefined,
  interviewStatus: mapInterviewStatusForUi(raw.status || raw.interviewStatus),
  panelMembers:
    (raw.interviewPanels || []).map((panel: any) => ({
      userId: panel.panelMemberId,
      userName:
        panel.panelMember?.firstName && panel.panelMember?.lastName
          ? `${panel.panelMember.firstName} ${panel.panelMember.lastName}`
          : panel.panelMemberName || 'Panel Member',
      roleSlug: panel.panelMember?.userRoles?.[0]?.role?.slug || 'interviewer',
    })) || [],
  questions: raw.questionsJson || undefined,
  evaluations:
    (raw.evaluations || []).map((evaluation: any) => ({
      id: evaluation.id,
      interviewId: evaluation.interviewId,
      evaluatorId: evaluation.evaluatorId,
      evaluatorName:
        evaluation.evaluator?.firstName && evaluation.evaluator?.lastName
          ? `${evaluation.evaluator.firstName} ${evaluation.evaluator.lastName}`
          : evaluation.evaluatorName || '',
      overallScore: evaluation.overallScore ?? 0,
      recommendation: evaluation.recommendation || 'hold',
      comments: evaluation.comments || '',
      submittedAt: evaluation.createdAt || new Date().toISOString(),
      criteriaScores: [],
    })) || [],
  hybridSegments: [],
});

export const mapBackendWorkforcePlan = (raw: any): WorkforcePlan => {
  const items = (raw.items || []).map((item: any) => ({
    id: item.id,
    workforcePlanId: item.workforcePlanId || raw.id,
    departmentId: item.departmentId || item.department_id || '',
    departmentName: item.department?.name || item.departmentName || 'General',
    jobTitle: item.jobTitle,
    employmentType: ((value: string) => {
      const normalized = String(value || 'full_time').toLowerCase();
      return (normalized === 'contract'
        ? 'contractor'
        : normalized) as WorkforcePlan['items'][number]['employmentType'];
    })(item.employmentType),
    grade: item.grade || item.job_grade,
    jobGrade: item.jobGrade || item.job_grade,
    salaryBudget: item.salaryBudget ?? item.salary_budget ? Number(item.salaryBudget ?? item.salary_budget) : undefined,
    positionType: item.positionType || item.position_type,
    replacementEmployeeRef: item.replacementEmployeeRef || item.replacement_employee_ref,
    expectedImpact: item.expectedImpact || item.expected_impact,
    requiredQualifications: item.requiredQualifications || item.required_qualifications,
    remarks: item.remarks,
    priority: item.priority,
    headcountRequired: item.headcount || 0,
    plannedStartDate:
      item.plannedStart?.slice(0, 10) ||
      item.plannedStart ||
      new Date().toISOString().slice(0, 10),
    justification: item.justification || '',
  }));

  return {
    id: raw.id,
    organizationId: raw.organizationId,
    title: raw.title || 'Workforce plan',
    departmentId:
      raw.departmentId ||
      raw.department_id ||
      items[0]?.departmentId ||
      '',
    departmentName: raw.departmentName || items[0]?.departmentName || 'General',
    businessUnit: raw.businessUnit || raw.business_unit || 'Corporate',
    planningPeriod:
      raw.planningYear ||
      raw.planning_year ||
      raw.planningPeriod ||
      '2027',
    planningType: raw.planningType === 'quarterly' ? 'quarterly' : 'annual',
    quarter: raw.planningQuarter || raw.planning_quarter || raw.quarter || undefined,
    startDate:
      raw.startDate ||
      items[0]?.plannedStartDate ||
      new Date().toISOString().slice(0, 10),
    endDate: raw.endDate || new Date().toISOString().slice(0, 10),
    justificationType: raw.justificationType || 'Standard',
    justification: raw.justification || '',
    supportingDocumentName: (() => {
      const comments = raw.hrReviewNotes || raw.hr_comments || '';
      const match = comments.match(/__doc::([^:]+(?::[^:]+)*)::(.+)/);
      if (match) return match[2];
      const fallback = raw.supportingDocumentName || undefined;
      if (!fallback) return undefined;
      return String(fallback).split('/').pop() || fallback;
    })(),
    status: (() => {
      const normalized = String(raw.status ?? '').toLowerCase();
      if (normalized === 'draft') return 'draft';
      if (normalized === 'submitted' || normalized === 'pending') return 'submitted';
      if (normalized === 'under_hr_review') return 'under_hr_review';
      if (normalized === 'under_ceo_review') return 'under_ceo_review';
      if (normalized === 'pending_ceo') return 'under_ceo_review';
      if (normalized === 'returned_for_revision') return 'returned_for_revision';
      if (normalized === 'closed') return 'closed';
      if (normalized === 'approved') return 'approved';
      if (normalized === 'rejected') return 'rejected';
      return 'draft';
    })(),
    createdBy:
      (typeof raw.createdBy === 'string'
        ? raw.createdBy
        : raw.createdBy?.id) ||
      raw.created_by_user_id ||
      raw.createdByUserId ||
      '',
    createdByName:
      raw.createdByName ||
      raw.created_by_name ||
      (raw.createdBy?.firstName && raw.createdBy?.lastName
        ? `${raw.createdBy.firstName} ${raw.createdBy.lastName}`
        : undefined),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    lastAutosaveAt: raw.lastAutosaveAt || undefined,
    hrReviewedBy: raw.hrReviewedBy || undefined,
    hrReviewedByName: raw.hrReviewedByName || undefined,
    hrReviewDate: raw.hrReviewDate || undefined,
    hrReviewNotes: raw.hrReviewNotes || undefined,
    approvedBy: raw.approvedBy || undefined,
    approvedByName: raw.approvedByName || undefined,
    approvalDate: raw.approvalDate || undefined,
    rejectedBy: raw.rejectedBy || undefined,
    rejectedByName: raw.rejectedByName || undefined,
    rejectedAt: raw.rejectedAt || undefined,
    rejectionReason: raw.rejectionReason || undefined,
    returnedComments: raw.returnedComments || raw.returned_comments || undefined,
    returnedAt: raw.returnedAt || raw.returned_at || undefined,
    returnedBy: raw.returnedBy || raw.returned_by || undefined,
    returnedByName: raw.returnedByName || raw.returned_by_name || undefined,
    versionNumber: raw.versionNumber ?? 1,
    revisions: raw.revisions || [],
    activities: raw.activities || [],
    items,
  };
};

export const normalizeWorkforcePlanPayload = (
  payload: WorkforcePlanFormPayload,
  status: 'draft' | 'submitted' = 'draft',
) => ({
  title: payload.title,
  planningPeriod: payload.planningPeriod,
  planningType: payload.planningType,
  justification: payload.justification,
  status,
  items: payload.items.map((item) => ({
    departmentId: item.departmentId,
    departmentName: item.departmentName,
    jobTitle: item.jobTitle,
    employmentType: normalizeEmploymentTypeForApi(item.employmentType),
    headcount: item.headcountRequired,
    plannedStart: item.plannedStartDate,
    justification:
      (item.justification || payload.justification || '').trim() || 'N/A',
  })),
});
