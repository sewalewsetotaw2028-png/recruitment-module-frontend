import type {
  WorkforcePlan,
  WorkforcePlanFormPayload,
  WorkforcePlanItem,
  WorkforcePlanLineInput,
  WorkforcePlanRevision,
  WorkforcePlanStatus,
} from '../types';

export function normalizeEmploymentType(
  value: string,
): WorkforcePlanItem['employmentType'] {
  const v = value.toLowerCase().replace(/\s+/g, '_');
  if (v.includes('part')) return 'part_time';
  if (v.includes('contract')) return 'contractor';
  if (v.includes('intern')) return 'internship';
  return 'full_time' as WorkforcePlanItem['employmentType'];
}

export function formatEmploymentType(
  type: WorkforcePlanItem['employmentType'],
): string {
  return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function versionLabel(versionNumber: number): string {
  return `V${versionNumber}.0`;
}

export function buildRevisionEntry(
  plan: WorkforcePlan,
  authorName: string,
  role: string,
  changes: string,
  statusLabel: string,
): WorkforcePlanRevision {
  return {
    version: versionLabel(plan.versionNumber),
    versionNumber: plan.versionNumber,
    date: new Date().toISOString().slice(0, 10),
    author: authorName,
    role,
    changes,
    status: statusLabel,
  };
}

export function mapLineItems(
  planId: string,
  items: WorkforcePlanLineInput[],
  defaultJustification: string,
): WorkforcePlanItem[] {
  return items.map((item, idx) => ({
    id: `wfpi-${planId}-${idx}-${Date.now()}`,
    workforcePlanId: planId,
    departmentId: item.departmentId || '',
    departmentName: item.departmentName,
    jobTitle: item.jobTitle,
    employmentType: normalizeEmploymentType(item.employmentType),
    grade: item.grade,
    priority: item.priority,
    headcountRequired: item.headcountRequired,
    plannedStartDate: item.plannedStartDate,
    justification: item.justification || defaultJustification,
  }));
}

export function lineItemsFromPlan(
  plan: WorkforcePlan,
): WorkforcePlanLineInput[] {
  return plan.items.map((item) => ({
    jobTitle: item.jobTitle,
    departmentName: item.departmentName,
    employmentType: item.employmentType,
    grade: item.grade,
    priority: item.priority,
    headcountRequired: item.headcountRequired,
    plannedStartDate: item.plannedStartDate,
    justification: item.justification,
  }));
}

export function payloadFromPlan(plan: WorkforcePlan): WorkforcePlanFormPayload {
  return {
    title: plan.title,
    departmentName: plan.departmentName,
    businessUnit: plan.businessUnit,
    planningPeriod: plan.planningPeriod,
    planningType: plan.planningType,
    quarter: plan.quarter,
    startDate: plan.startDate,
    endDate: plan.endDate,
    justificationType: plan.justificationType,
    justification: plan.justification,
    supportingDocumentName: plan.supportingDocumentName,
    items: lineItemsFromPlan(plan),
  };
}

export function getApprovalSteps(status: WorkforcePlanStatus) {
  const hrDone =
    status === 'pending_ceo' ||
    status === 'approved' ||
    status === 'rejected';
  const ceoDone = status === 'approved';
  return [
    {
      label: 'Draft',
      icon: 'edit_note',
      done: status !== 'draft',
      active: status === 'draft',
    },
    {
      label: 'HR Manager Review',
      icon: 'manage_accounts',
      done: hrDone,
      active: status === 'submitted',
    },
    {
      label: 'CEO Authorization',
      icon: 'verified_user',
      done: ceoDone,
      active: status === 'pending_ceo',
    },
    { label: 'Plan Authorized', icon: 'task_alt', done: ceoDone, active: false },
  ];
}

export function statusBadge(
  status: WorkforcePlanStatus,
): { label: string; className: string } {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      };
    case 'pending_ceo':
      return {
        label: 'Pending CEO',
        className: 'bg-purple-50 text-purple-800 border border-purple-200',
      };
    case 'submitted':
      return {
        label: 'Submitted',
        className: 'bg-blue-50 text-blue-800 border border-blue-200',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-red-50 text-red-800 border border-red-200',
      };
    default:
      return {
        label: 'Draft',
        className: 'bg-amber-50 text-amber-800 border border-amber-200',
      };
  }
}
