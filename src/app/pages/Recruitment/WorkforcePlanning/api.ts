import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type {
  WorkforcePlan,
  WorkforcePlanFormPayload,
  WorkforcePlanStatus,
} from '@/types';

const normalizeEmploymentType = (
  employmentType: WorkforcePlan['items'][number]['employmentType'],
) => {
  // Backend accepts CONTRACT (not CONTRACTOR). Keep UI type as-is and map on write.
  return employmentType === 'contractor' ? 'contract' : employmentType;
};

const normalizePriority = (
  value: unknown,
): 'High' | 'Medium' | 'Low' | undefined => {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return undefined;
};

const normalizePositionType = (
  value: unknown,
): 'new' | 'replacement' | undefined => {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'new') return 'new';
  if (normalized === 'replacement') return 'replacement';
  return undefined;
};

const normalizeWorkforcePlanStatus = (
  raw: unknown,
): WorkforcePlan['status'] => {
  const value = String(raw ?? '').trim();
  if (!value) return 'draft';

  const normalized = value.toLowerCase();

  // Prisma / enum style
  if (normalized === 'draft') return 'draft';
  if (normalized === 'submitted') return 'submitted';
  if (normalized === 'under_hr_review' || normalized === 'under-hr-review')
    return 'under_hr_review';
  if (normalized === 'under_ceo_review' || normalized === 'under-ceo-review')
    return 'under_ceo_review';
  if (normalized === 'returned_for_revision') return 'returned_for_revision';
  if (normalized === 'closed') return 'closed';
  if (normalized === 'approved') return 'approved';
  if (normalized === 'rejected') return 'rejected';

  // Legacy UI alias
  if (normalized === 'pending_ceo' || normalized === 'pending-ceo')
    return 'under_ceo_review';

  return 'draft';
};

export const normalizeWorkforcePlanPayload = (
  payload: WorkforcePlanFormPayload,
  status?: WorkforcePlanStatus | 'draft' | 'submitted',
) => ({
  title: payload.title,
  planning_period: payload.planningPeriod,
  planning_type: payload.planningType,
  justification: payload.justification,
  ...(status !== undefined ? { status } : {}),
  business_unit: payload.businessUnit,
  department_name: payload.departmentName,
  start_date: payload.startDate,
  end_date: payload.endDate,
  justification_type: payload.justificationType,
  supporting_document_name: payload.supportingDocumentName,
  items: payload.items.map((item) => ({
    department_id: item.departmentId,
    department_name: item.departmentName,
    job_title: item.jobTitle,
    employment_type: normalizeEmploymentType(item.employmentType),
    headcount: item.headcountRequired,
    planned_start: item.plannedStartDate,
    job_grade: item.jobGrade || item.grade,
    salary_budget:
      item.salaryBudget === undefined ? undefined : item.salaryBudget,
    position_type: item.positionType,
    replacement_employee_ref: item.replacementEmployeeRef,
    expected_impact: item.expectedImpact,
    required_qualifications: item.requiredQualifications,
    remarks: item.remarks,
    priority: item.priority,
    // Backend requires a non-empty justification for each line.
    // Fall back to overall plan justification if user left the line blank.
    justification:
      (item.justification || payload.justification || '').trim() || 'N/A',
  })),
});

const mapApiWorkforcePlan = (raw: any): WorkforcePlan => {
  const items = (raw.items || []).map((item: any) => ({
    id: item.id,
    workforcePlanId: raw.id,
    departmentId:
      item.departmentId || item.department?.id || item.department_id || '',
    departmentName:
      item.departmentName ||
      item.department?.name ||
      item.department_name ||
      'General',
    jobTitle: item.jobTitle || item.job_title || 'Unknown title',
    employmentType: (() => {
      const value = String(
        item.employmentType || item.employment_type || 'full_time',
      ).toLowerCase();
      return (
        value === 'contract' ? 'contractor' : value
      ) as WorkforcePlan['items'][number]['employmentType'];
    })(),
    grade: item.grade || item.job_grade,
    jobGrade: item.jobGrade || item.job_grade,
    salaryBudget: (() => {
      const value = item.salaryBudget ?? item.salary_budget;
      return value === undefined || value === null ? undefined : Number(value);
    })(),
    positionType: normalizePositionType(
      item.positionType || item.position_type,
    ),
    replacementEmployeeRef:
      item.replacementEmployeeRef || item.replacement_employee_ref,
    expectedImpact: item.expectedImpact || item.expected_impact,
    requiredQualifications:
      item.requiredQualifications || item.required_qualifications,
    remarks: item.remarks,
    priority: normalizePriority(item.priority),
    headcountRequired: item.headcount || item.headcountRequired || 0,
    plannedStartDate:
      item.plannedStart?.slice(0, 10) ||
      item.planned_start?.slice(0, 10) ||
      item.plannedStartDate ||
      new Date().toISOString().slice(0, 10),
    justification: item.justification || '',
  }));

  return {
    id: raw.id,
    organizationId: raw.organizationId || raw.company_id || '',
    title: raw.title || 'Workforce plan',
    departmentId: (() => {
      const value =
        raw.departmentId ||
        raw.department_id ||
        items[0]?.departmentId ||
        undefined;
      return value ? String(value) : undefined;
    })(),
    departmentName:
      raw.departmentName ||
      raw.department_name ||
      items[0]?.departmentName ||
      'General',
    businessUnit: raw.businessUnit || raw.business_unit || 'Corporate',
    planningPeriod:
      raw.planningYear ||
      raw.planning_year ||
      raw.planningPeriod ||
      raw.planning_period ||
      new Date().getFullYear().toString(),
    planningType:
      raw.planningType === 'quarterly' || raw.planning_type === 'quarterly'
        ? 'quarterly'
        : 'annual',
    quarter:
      raw.planningQuarter || raw.planning_quarter || raw.quarter || undefined,
    startDate:
      raw.startDate ||
      raw.start_date ||
      items[0]?.plannedStartDate ||
      new Date().toISOString().slice(0, 10),
    endDate:
      raw.endDate || raw.end_date || new Date().toISOString().slice(0, 10),
    justificationType:
      raw.justificationType || raw.justification_type || 'New role',
    justification: raw.justification || '',
    supportingDocumentName:
      raw.supportingDocumentName || raw.supporting_document_name || undefined,
    status: normalizeWorkforcePlanStatus(raw.status),
    createdBy: raw.createdBy || raw.createdByUserId || raw.created_by?.id || '',
    createdByName:
      raw.createdByName ||
      raw.created_by_name ||
      [raw.created_by?.first_name, raw.created_by?.last_name]
        .filter(Boolean)
        .join(' ') ||
      undefined,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
    lastAutosaveAt: raw.lastAutosaveAt || raw.last_autosave_at,
    hrReviewedBy: raw.hrReviewedBy || raw.hr_reviewed_by || undefined,
    hrReviewedByName:
      raw.hrReviewedByName || raw.hr_reviewed_by_name || undefined,
    hrReviewDate: raw.hrReviewDate || raw.hr_review_date || undefined,
    hrReviewNotes: raw.hrReviewNotes || raw.hr_review_notes || undefined,
    approvedBy: raw.approvedBy || raw.approved_by || undefined,
    approvedByName: raw.approvedByName || raw.approved_by_name || undefined,
    approvalDate: raw.approvalDate || raw.approval_date || undefined,
    rejectedBy: raw.rejectedBy || raw.rejected_by || undefined,
    rejectedByName: raw.rejectedByName || raw.rejected_by_name || undefined,
    rejectedAt: raw.rejectedAt || raw.rejected_at || undefined,
    rejectionReason: raw.rejectionReason || raw.rejection_reason || undefined,
    returnedComments:
      raw.returnedComments || raw.returned_comments || undefined,
    returnedAt: raw.returnedAt || raw.returned_at || undefined,
    returnedBy: raw.returnedBy || raw.returned_by || undefined,
    returnedByName: raw.returnedByName || raw.returned_by_name || undefined,
    versionNumber: raw.versionNumber ?? raw.version_number ?? 1,
    revisions: Array.isArray(raw.revisions) ? raw.revisions : [],
    approvalHistories: Array.isArray(raw.approvalHistories)
      ? raw.approvalHistories.map((entry: any) => ({
          id: entry.id,
          entityType: entry.entityType || entry.entity_type || 'WorkforcePlan',
          entityId: entry.entityId || entry.entity_id || raw.id,
          action: entry.action,
          actorId: entry.actorId || entry.actor_user_id || '',
          actorName:
            entry.actorName ||
            [entry.actor?.first_name, entry.actor?.last_name]
              .filter(Boolean)
              .join(' ') ||
            'System',
          comments: entry.comments,
          createdAt:
            entry.createdAt || entry.created_at || new Date().toISOString(),
        }))
      : Array.isArray(raw.approval_histories)
        ? raw.approval_histories.map((entry: any) => ({
            id: entry.id,
            entityType:
              entry.entityType || entry.entity_type || 'WorkforcePlan',
            entityId: entry.entityId || entry.entity_id || raw.id,
            action: entry.action,
            actorId: entry.actorId || entry.actor_user_id || '',
            actorName:
              entry.actorName ||
              [entry.actor?.first_name, entry.actor?.last_name]
                .filter(Boolean)
                .join(' ') ||
              'System',
            comments: entry.comments,
            createdAt:
              entry.createdAt || entry.created_at || new Date().toISOString(),
          }))
        : [],
    activities: raw.activities || [],
    items,
  };
};

export const fetchWorkforcePlans = async (): Promise<WorkforcePlan[]> => {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: 'GET',
    route: API_ROUTES.workforce.plans,
    isSecureRoute: true,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((row) => mapApiWorkforcePlan(row));
};

export const fetchWorkforcePlanById = async (
  planId: string,
): Promise<WorkforcePlan> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: 'GET',
    route: API_ROUTES.workforce.plan(planId),
    isSecureRoute: true,
  });
  return mapApiWorkforcePlan((data as any).data || data);
};

export const fetchWorkforceDepartments = async (): Promise<
  Array<{ id: string; name: string }>
> => {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: 'GET',
    route: API_ROUTES.workforce.departments,
    isSecureRoute: true,
  });
  if (!Array.isArray(data?.data)) return [];
  return data.data.map((raw) => ({
    id: (raw as any).id,
    name: (raw as any).name,
  }));
};

export const createWorkforcePlan = async (
  payload: WorkforcePlanFormPayload,
  status: 'draft' | 'submitted' = 'draft',
): Promise<WorkforcePlan> => {
  const body = normalizeWorkforcePlanPayload(payload, status);
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: 'POST',
    route: API_ROUTES.workforce.plans,
    body,
    isSecureRoute: true,
  });
  return mapApiWorkforcePlan((data as any).data || data);
};

export const updateWorkforcePlan = async (
  planId: string,
  payload: WorkforcePlanFormPayload,
  status?: WorkforcePlanStatus | 'draft' | 'submitted',
): Promise<WorkforcePlan> => {
  const body = normalizeWorkforcePlanPayload(payload, status);
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: 'PUT',
    route: API_ROUTES.workforce.plan(planId),
    body,
    isSecureRoute: true,
  });
  return mapApiWorkforcePlan((data as any).data || data);
};

export const submitWorkforcePlan = async (planId: string): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.workforce.submitPlan(planId),
    isSecureRoute: true,
  });
};

/**
 * HR review step:
 * - Backend provides a dedicated forward endpoint so the HR review trail is
 *   recorded consistently.
 */
export const forwardWorkforcePlanToCeo = async (
  planId: string,
  notes?: string,
): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.workforce.forwardPlan(planId),
    isSecureRoute: true,
    body: {
      notes,
    },
  });
};

export const returnWorkforcePlanForRevision = async (
  planId: string,
  reason: string,
): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.workforce.returnPlan(planId),
    isSecureRoute: true,
    body: {
      reason,
    },
  });
};

export const approveWorkforcePlan = async (planId: string): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.workforce.approvePlan(planId),
    isSecureRoute: true,
  });
};

export const rejectWorkforcePlan = async (
  planId: string,
  reason: string,
): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.workforce.rejectPlan(planId),
    body: { reason },
    isSecureRoute: true,
  });
};

export const deleteWorkforcePlan = async (planId: string): Promise<void> => {
  await makeCall({
    method: 'DELETE',
    route: API_ROUTES.workforce.plan(planId),
    isSecureRoute: true,
  });
};
