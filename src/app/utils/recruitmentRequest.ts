import type {
  RecruitmentRequest,
  RecruitmentRequestFormPayload,
  RecruitmentRequestRevision,
  RecruitmentRequestStatus,
  WorkforcePlan,
} from '../types';

export function generateReferenceCode(
  planningPeriod: string,
  quarter?: string,
  seq = 1,
): string {
  const q = quarter || 'Q1';
  return `HRP-${planningPeriod}-${q}-${String(seq).padStart(3, '0')}`;
}

export function derivePlannedRequestStaffingFields(
  plan?: WorkforcePlan | null,
): {
  location?: string;
  hiringManagerId?: string;
  hiringManagerName?: string;
} {
  if (!plan) return {};

  const location = plan.businessUnit?.trim();
  const hiringManagerId = plan.createdBy?.trim();
  const hiringManagerName = plan.createdByName?.trim();

  return {
    ...(location ? { location } : {}),
    ...(hiringManagerId ? { hiringManagerId } : {}),
    ...(hiringManagerName ? { hiringManagerName } : {}),
  };
}

export function buildWorkforcePlanReference(plan: WorkforcePlan): string {
  const period =
    plan.planningType === 'quarterly' && plan.quarter
      ? `${plan.quarter} ${plan.planningPeriod}`
      : `FY ${plan.planningPeriod}`;
  return `${plan.title} (${period})`;
}

export function getApprovalSteps(status: RecruitmentRequestStatus) {
  const hrDone = [
    'under_review',
    'pending_ceo',
    'approved',
    'rejected',
  ].includes(status);
  const ceoDone = status === 'approved';
  return [
    {
      label: 'Draft',
      icon: 'edit_note',
      done: status !== 'draft',
      active: status === 'draft',
    },
    {
      label: 'Submitted',
      icon: 'send',
      done: status !== 'draft',
      active: status === 'submitted',
    },
    {
      label: 'HR Review',
      icon: 'manage_accounts',
      done: hrDone,
      active: status === 'submitted' || status === 'under_review',
    },
    {
      label: 'CEO Approval',
      icon: 'verified_user',
      done: ceoDone,
      active: status === 'pending_ceo',
    },
    { label: 'Approved', icon: 'task_alt', done: ceoDone, active: false },
  ];
}

export function statusBadge(status: RecruitmentRequestStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'approved':
      return {
        label: '✅ Approved',
        className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      };
    case 'pending_ceo':
      return {
        label: '🟣 Pending CEO',
        className: 'bg-purple-50 text-purple-800 border border-purple-200',
      };
    case 'under_review':
      return {
        label: '🔵 Under Review',
        className: 'bg-blue-50 text-blue-800 border border-blue-200',
      };
    case 'submitted':
      return {
        label: '📤 Submitted',
        className: 'bg-sky-50 text-sky-800 border border-sky-200',
      };
    case 'rejected':
      return {
        label: '🔴 Rejected',
        className: 'bg-red-50 text-red-800 border border-red-200',
      };
    case 'closed':
      return {
        label: 'Closed',
        className: 'bg-surface-container text-on-surface-variant',
      };
    default:
      return {
        label: '🟡 Draft',
        className: 'bg-amber-50 text-amber-800 border border-amber-200',
      };
  }
}

export function buildRevision(
  authorName: string,
  role: string,
  changes: string,
  statusLabel: string,
): RecruitmentRequestRevision {
  return {
    version: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    author: authorName,
    role,
    changes,
    status: statusLabel,
  };
}

export function payloadFromRequest(
  req: RecruitmentRequest,
): RecruitmentRequestFormPayload {
  return {
    requestTitle: req.requestTitle,
    hiringManagerId: req.hiringManagerId,
    departmentId: req.departmentId,
    departmentName: req.departmentName,
    jobTitle: req.jobTitle,
    grade: req.grade,
    priority: req.priority,
    employmentType: req.employmentType,
    numberOfOpenings: req.numberOfOpenings,
    location: req.location,
    requestType: req.requestType,
    workforcePlanId: req.workforcePlanId,
    workforcePlanItemId: req.workforcePlanItemId,
    isReplacement: req.isReplacement,
    replacementEmployeeId: req.replacementEmployeeId,
    replacementReason: req.replacementReason,
    justification: req.justification,
    supportingDocumentName: req.supportingDocumentName,
    customFieldValues: req.customFieldValues || {},
  };
}

export function validateRequestPayload(
  payload: RecruitmentRequestFormPayload,
  submit: boolean,
): string | null {
  if (!payload.requestTitle.trim()) return 'Request title is required.';
  if (!payload.hiringManagerId) return 'Hiring manager is required.';
  if (payload.requestType === 'planned' && !payload.workforcePlanId) {
    return 'Planned hiring requires an approved workforce plan link.';
  }
  if (
    payload.requestType === 'unplanned' &&
    submit &&
    payload.justification.trim().length < 20
  ) {
    return 'Unplanned hiring requires detailed justification (min 20 characters).';
  }
  if (submit && payload.justification.trim().length < 10) {
    return 'Business justification is required.';
  }
  if (payload.isReplacement) {
    if (!payload.replacementEmployeeId?.trim())
      return 'Replacing employee ID is required.';
    if (!payload.replacementReason?.trim())
      return 'Reason for replacement is required.';
  }
  return null;
}
