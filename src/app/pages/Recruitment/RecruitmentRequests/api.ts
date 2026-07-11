// @ts-nocheck
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type { RecruitmentRequest } from '@/types';

export interface RecruitmentRequestPayload {
  workforcePlanItemId?: string;
  departmentId?: string;
  positionName?: string;
  requestTitle?: string;
  jobTitle?: string;
  employmentType?: string;
  requestType?: 'planned' | 'unplanned';
  priority?: string;
  isReplacement?: boolean;
  replacementEmployeeId?: string;
  replacementForEmployeeId?: string;
  replacementReason?: string;
  justification?: string;
  headcount?: number;
  numberOfOpenings?: number;
  /** Hiring manager user ID — stored in custom_field_values */
  hiringManagerId?: string;
  /** Hiring manager display name — stored in custom_field_values */
  hiringManagerName?: string;
  /** Work location — stored in custom_field_values */
  location?: string;
  customFieldValues?: Record<string, string>;
}

export type HiringManagerOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export function resolveHiringManagerName(
  hiringManagerId: string | undefined,
  options: HiringManagerOption[],
): string {
  if (!hiringManagerId) return '';
  const found = options.find((hm) => hm.id === hiringManagerId);
  if (!found) return '';
  return `${found.firstName} ${found.lastName}`.trim();
}

export function withResolvedHiringManagerName<
  T extends { hiringManagerId?: string; hiringManagerName?: string },
>(request: T, options: HiringManagerOption[]): T {
  if (request.hiringManagerName?.trim()) return request;
  const resolved = resolveHiringManagerName(request.hiringManagerId, options);
  if (!resolved) return request;
  return { ...request, hiringManagerName: resolved };
}

export async function fetchHiringManagerOptions(): Promise<
  HiringManagerOption[]
> {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: 'GET',
    route: API_ROUTES.users.hiringManagers,
    isSecureRoute: true,
  });
  const rows = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
      ? data
      : [];
  return rows
    .map((user: any) => ({
      id: String(user.id ?? ''),
      firstName: String(user.firstName ?? user.first_name ?? ''),
      lastName: String(user.lastName ?? user.last_name ?? ''),
    }))
    .filter((user) => user.id);
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : undefined;

const normalizeStatus = (value: unknown): RecruitmentRequest['status'] => {
  const status = String(value ?? 'draft').toLowerCase();
  if (status === 'under_review') return 'under_review';
  if (status === 'submitted') return 'submitted';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'cancelled') return 'closed';
  return 'draft';
};

const normalizeEmploymentType = (
  value: unknown,
): RecruitmentRequest['employmentType'] => {
  const normalized = String(value ?? 'full_time').toLowerCase();
  return (normalized === 'contract'
    ? 'contractor'
    : normalized) as RecruitmentRequest['employmentType'];
};

const deriveWorkforcePlanStaffing = (raw: any) => {
  const planItem = raw.workforce_plan_item;
  const plan = planItem?.workforce_plan;
  const manager = planItem?.department?.manager ?? plan?.created_by;

  return {
    location: asString(plan?.business_unit)?.trim() || '',
    hiringManagerId:
      asString(manager?.id) || asString(plan?.created_by_user_id) || '',
    hiringManagerName:
      [manager?.first_name, manager?.last_name].filter(Boolean).join(' ') ||
      '',
  };
};

export const mapApiRecruitmentRequest = (raw: any): RecruitmentRequest => {
  const requestedByName =
    [raw.requested_by?.first_name, raw.requested_by?.last_name]
      .filter(Boolean)
      .join(' ') || asString(raw.requested_by_name) || 'Unknown';

  const planStaffing = deriveWorkforcePlanStaffing(raw);

  const requestType =
    raw.planning_type === 'UNPLANNED' || raw.planning_type === 'unplanned'
      ? 'unplanned'
      : 'planned';

  const isReplacement =
    raw.request_type === 'REPLACEMENT' ||
    raw.request_type === 'replacement' ||
    Boolean(raw.is_replacement);

  const title =
    asString(raw.position_name) ||
    asString(raw.request_title) ||
    asString(raw.job_title) ||
    'Recruitment request';

  return {
    id: asString(raw.id) ?? '',
    organizationId: asString(raw.company_id) || asString(raw.organizationId) || '',
    referenceCode:
      asString(raw.request_number) ||
      asString(raw.referenceCode) ||
      `REQ-${String(raw.id ?? '').slice(-6).toUpperCase()}`,
    workforcePlanId: asString(raw.workforce_plan_id) ||
      asString(raw.workforce_plan_item?.workforce_plan_id) ||
      asString(raw.workforce_plan_item?.workforce_plan?.id),
    workforcePlanItemId: asString(raw.workforce_plan_item_id),
    workforcePlanReference: asString(raw.workforce_plan_reference) ||
      asString(raw.workforce_plan_item?.workforce_plan?.title),
    requestTitle: title,
    requestedBy: asString(raw.requested_by_user_id) || asString(raw.requestedBy) || '',
    requestedByName,
    hiringManagerId:
      asString(raw.custom_field_values?.__hiring_manager_id) ||
      (requestType === 'planned' ? planStaffing.hiringManagerId : '') ||
      asString(raw.hiringManagerId) ||
      '',
    hiringManagerName: (() => {
      const storedName = asString(raw.custom_field_values?.__hiring_manager_name);
      if (storedName) return storedName;
      if (requestType === 'planned' && planStaffing.hiringManagerName) {
        return planStaffing.hiringManagerName;
      }
      const storedId = asString(raw.custom_field_values?.__hiring_manager_id);
      if (storedId) {
        const requestedById = asString(raw.requested_by_user_id);
        if (
          storedId === requestedById &&
          requestedByName &&
          requestedByName !== 'Unknown'
        ) {
          return requestedByName;
        }
      }
      return asString(raw.hiringManagerName) || '';
    })(),
    departmentId: asString(raw.department_id) || asString(raw.department?.id) || '',
    departmentName:
      asString(raw.department?.name) ||
      asString(raw.department_name) ||
      'General',
    jobTitle: asString(raw.job_title) || title,
    grade: asString(raw.job_grade) || '',
    priority: String(raw.priority ?? 'Medium').toLowerCase().replace(/^\w/, (c) =>
      c.toUpperCase(),
    ) as RecruitmentRequest['priority'],
    employmentType: normalizeEmploymentType(raw.employment_type),
    numberOfOpenings: Number(raw.headcount ?? raw.numberOfOpenings ?? 1),
    location:
      asString(raw.custom_field_values?.__location) ||
      (requestType === 'planned' ? planStaffing.location : '') ||
      asString(raw.location) ||
      '',
    requestType,
    isReplacement,
    replacementEmployeeId:
      asString(raw.replacement_for_employee_id) ||
      asString(raw.replacement_employee_id),
    replacementReason: asString(raw.replacement_reason),
    justification: asString(raw.justification) || '',
    supportingDocumentName: (() => {
      // Check hr_comments for embedded doc tag: __doc::storageUri::originalFilename
      // Use [^\n]+ so appended HR notes don't bleed into the filename
      const comments = asString(raw.hr_comments) || '';
      const match = comments.match(/__doc::([^:]+(?::[^:]+)*)::([^\n]+)/);
      if (match) return match[2].trim();
      const fallback = asString(raw.supporting_document_name);
      if (!fallback) return undefined;
      return fallback.split('/').pop() || fallback;
    })(),
    supportingDocumentUrl: (() => {
      const comments = asString(raw.hr_comments) || '';
      const match = comments.match(/__doc::([^:]+(?::[^:]+)*)::([^\n]+)/);
      if (match) return match[1].trim();
      return asString(raw.supporting_document_name);
    })(),
    jobDescription: asString(raw.description) || '',
    requiredSkills: Array.isArray(raw.required_skills) ? raw.required_skills : [],
    experienceYears: Number(raw.experience_years ?? 0),
    salaryMin: raw.salary_min == null ? undefined : Number(raw.salary_min),
    salaryMax: raw.salary_max == null ? undefined : Number(raw.salary_max),
    jobTemplateId: asString(raw.job_template_id),
    status: normalizeStatus(raw.status),
    // hrReviewNotes and rejectionReason both live in hr_comments on the backend.
    // Strip any embedded __doc:: tag first, then return the remaining text.
    hrReviewNotes: (() => {
      const c = asString(raw.hr_comments) || '';
      if (!c) return undefined;
      const stripped = c.replace(/__doc::[^\n]*\n?/, '').trim();
      // Only show as review notes when not rejected (rejection uses same field)
      if (stripped && raw.status !== 'REJECTED' && asString(raw.status)?.toLowerCase() !== 'rejected') {
        return stripped;
      }
      return undefined;
    })(),
    rejectionReason: (() => {
      const c = asString(raw.hr_comments) || '';
      if (!c) return undefined;
      const stripped = c.replace(/__doc::[^\n]*\n?/, '').trim();
      const st = asString(raw.status)?.toUpperCase();
      if (stripped && (st === 'REJECTED')) return stripped;
      return undefined;
    })(),
    approvedBy: asString(raw.approved_by_user_id),
    approvedByName: (() => {
      if (raw.approved_by?.first_name) {
        return `${raw.approved_by.first_name} ${raw.approved_by.last_name}`.trim();
      }
      return undefined;
    })(),
    linkedVacancyId: asString(raw.vacancy?.id),
    customFieldValues: raw.custom_field_values || {},
    createdAt: asString(raw.created_at) || new Date().toISOString(),
    updatedAt: asString(raw.updated_at) || new Date().toISOString(),
    revisions: Array.isArray(raw.revisions) ? raw.revisions : [],
    activities: Array.isArray(raw.activities) ? raw.activities : [],
  };
};

const toApiPayload = (
  payload: RecruitmentRequestPayload,
  status?: 'draft' | 'submitted',
) => {
  const hiringManagerId =
    payload.hiringManagerId ||
    payload.customFieldValues?.__hiring_manager_id;
  const hiringManagerName =
    payload.hiringManagerName ||
    payload.customFieldValues?.__hiring_manager_name;

  return {
  workforce_plan_item_id: payload.workforcePlanItemId,
  department_id: payload.departmentId,
  position_name:
    payload.positionName || payload.requestTitle || payload.jobTitle,
  request_title:
    payload.requestTitle || payload.positionName || payload.jobTitle,
  job_title: payload.jobTitle || payload.requestTitle || payload.positionName,
  employment_type: payload.employmentType,
  request_type: payload.isReplacement ? 'replacement' : 'new_headcount',
  planning_type: payload.requestType || 'planned',
  priority: payload.priority,
  is_replacement: payload.isReplacement,
  replacement_employee_id:
    payload.replacementForEmployeeId || payload.replacementEmployeeId,
  replacement_reason: payload.replacementReason,
  justification: payload.justification,
  status,
  headcount: payload.headcount ?? payload.numberOfOpenings,
  // Merge hiring_manager_id, hiring_manager_name, and location into custom_field_values
  // so they round-trip without requiring schema column changes.
  custom_field_values: {
    ...(payload.customFieldValues || {}),
    ...(hiringManagerId
      ? { __hiring_manager_id: hiringManagerId }
      : {}),
    ...(hiringManagerName
      ? { __hiring_manager_name: hiringManagerName }
      : {}),
    ...(payload.location
      ? { __location: payload.location }
      : {}),
  },
  };
};

export const fetchRecruitmentRequests = async (): Promise<
  RecruitmentRequest[]
> => {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: 'GET',
    route: API_ROUTES.recruitment.requests,
    isSecureRoute: true,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(mapApiRecruitmentRequest);
};

export const fetchRecruitmentRequestById = async (
  id: string,
): Promise<RecruitmentRequest> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: 'GET',
    route: API_ROUTES.recruitment.request(id),
    isSecureRoute: true,
  });
  return mapApiRecruitmentRequest((data as any).data || data);
};

export const createRecruitmentRequest = async (
  payload: RecruitmentRequestPayload,
  status: 'draft' | 'submitted' = 'draft',
): Promise<RecruitmentRequest> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: 'POST',
    route: API_ROUTES.recruitment.requests,
    body: toApiPayload(payload, status),
    isSecureRoute: true,
  });
  return mapApiRecruitmentRequest((data as any).data || data);
};

export const updateRecruitmentRequest = async (
  id: string,
  payload: RecruitmentRequestPayload,
): Promise<RecruitmentRequest> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: 'PUT',
    route: API_ROUTES.recruitment.request(id),
    body: toApiPayload(payload),
    isSecureRoute: true,
  });
  return mapApiRecruitmentRequest((data as any).data || data);
};

export const submitRecruitmentRequest = async (id: string): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: `${API_ROUTES.recruitment.request(id)}/submit`,
    isSecureRoute: true,
  });
};

export const hrReviewRecruitmentRequest = async (
  id: string,
  action: 'approve' | 'reject',
  notes?: string,
): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.recruitment.reviewRequest(id),
    body: { action, notes },
    isSecureRoute: true,
  });
};

export const approveRecruitmentRequest = async (id: string): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.recruitment.approveRequest(id),
    isSecureRoute: true,
  });
};

export const rejectRecruitmentRequest = async (
  id: string,
  reason: string,
): Promise<void> => {
  await makeCall({
    method: 'POST',
    route: API_ROUTES.recruitment.rejectRequest(id),
    body: { reason },
    isSecureRoute: true,
  });
};

export const deleteRecruitmentRequest = async (id: string): Promise<void> => {
  await makeCall({
    method: 'DELETE',
    route: API_ROUTES.recruitment.request(id),
    isSecureRoute: true,
  });
};
