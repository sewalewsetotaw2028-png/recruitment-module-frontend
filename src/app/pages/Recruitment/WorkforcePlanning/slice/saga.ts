import { all, call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import {
  approveWorkforcePlan,
  forwardWorkforcePlanToCeo,
  rejectWorkforcePlan,
  returnWorkforcePlanForRevision,
  submitWorkforcePlan,
} from '../../WorkforcePlanning/api';
import { workforcePlanningActions } from './index';
import type { WorkforcePlan } from '@/types';
import type { PayloadAction } from '@reduxjs/toolkit';

type ApiRaw = Record<string, unknown>;

type ApiWorkforcePlanRaw = ApiRaw & {
  items?: unknown;
  department?: unknown;
  created_by?: unknown;
  status?: unknown;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : undefined;

const asObject = (value: unknown): ApiRaw | undefined =>
  typeof value === 'object' && value !== null ? (value as ApiRaw) : undefined;

const normalizeEmploymentType = (
  value: string,
): WorkforcePlan['items'][number]['employmentType'] => {
  const normalized = value.toLowerCase();
  if (normalized === 'contract') return 'contractor';
  return normalized as WorkforcePlan['items'][number]['employmentType'];
};

const normalizeWorkforcePlanStatus = (value: unknown): WorkforcePlan['status'] => {
  const normalized = asString(value)?.toLowerCase() ?? '';
  if (!normalized) return 'draft';

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

  // Legacy alias
  if (normalized === 'pending_ceo') return 'under_ceo_review';

  return 'draft';
};

function mapApiWorkforcePlan(raw: ApiWorkforcePlanRaw): WorkforcePlan {
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  const items = rawItems.map((itemRaw) => {
    const item = asObject(itemRaw) ?? {};
    const department = asObject(item.department);
    const plannedStart =
      asString(item.plannedStart) || asString(item.planned_start);

    return {
      id: asString(item.id) ?? '',
      workforcePlanId: asString(raw.id) ?? '',
    departmentId:
      asString(item.departmentId) ||
      asString(department?.id) ||
      asString(item.department_id) ||
      '',
      departmentName:
        asString(item.departmentName) ||
        asString(department?.name) ||
        asString(item.department_name) ||
        'General',
      jobTitle:
        asString(item.jobTitle) || asString(item.job_title) || 'Unknown title',
      employmentType: normalizeEmploymentType(
        asString(item.employmentType) ||
          asString(item.employment_type) ||
          'full_time',
      ),
      grade: asString(item.grade),
      priority: asString(
        item.priority,
      ) as WorkforcePlan['items'][number]['priority'],
      headcountRequired:
        Number(item.headcount ?? item.headcountRequired ?? 0) || 0,
      plannedStartDate:
        plannedStart?.slice(0, 10) ||
        asString(item.plannedStartDate) ||
        new Date().toISOString().slice(0, 10),
      justification: asString(item.justification) || '',
    };
  });

  const createdByObj = asObject(raw.created_by);

  return {
    id: asString(raw.id) ?? '',
    organizationId:
      asString(raw.organizationId) || asString(raw.company_id) || '',
    title: asString(raw.title) || 'Workforce plan',
    departmentName:
      asString(raw.departmentName) ||
      asString(raw.department_name) ||
      items[0]?.departmentName ||
      'General',
    businessUnit:
      asString(raw.businessUnit) || asString(raw.business_unit) || 'Corporate',
    planningPeriod:
      asString(raw.planningYear) ||
      asString(raw.planning_year) ||
      asString(raw.planningPeriod) ||
      asString(raw.planning_period) ||
      new Date().getFullYear().toString(),
    planningType:
      asString(raw.planningType) === 'quarterly' ||
      asString(raw.planning_type) === 'quarterly'
        ? 'quarterly'
        : 'annual',
    quarter:
      asString(raw.planningQuarter) ||
      asString(raw.planning_quarter) ||
      asString(raw.quarter),
    startDate:
      asString(raw.startDate) ||
      asString(raw.start_date) ||
      items[0]?.plannedStartDate ||
      new Date().toISOString().slice(0, 10),
    endDate:
      asString(raw.endDate) ||
      asString(raw.end_date) ||
      new Date().toISOString().slice(0, 10),
    justificationType:
      asString(raw.justificationType) ||
      asString(raw.justification_type) ||
      'New role',
    justification: asString(raw.justification) || '',
    supportingDocumentName:
      asString(raw.supportingDocumentName) ||
      asString(raw.supporting_document_name) ||
      undefined,
    status: normalizeWorkforcePlanStatus(raw.status),
    createdBy: asString(raw.createdBy) || asString(raw.created_by) || '',
    createdByName:
      asString(raw.createdByName) ||
      asString(raw.created_by_name) ||
      [asString(createdByObj?.first_name), asString(createdByObj?.last_name)]
        .filter(Boolean)
        .join(' ') ||
      undefined,
    createdAt:
      asString(raw.createdAt) ||
      asString(raw.created_at) ||
      new Date().toISOString(),
    updatedAt:
      asString(raw.updatedAt) ||
      asString(raw.updated_at) ||
      new Date().toISOString(),
    lastAutosaveAt:
      asString(raw.lastAutosaveAt) || asString(raw.last_autosave_at),
    hrReviewedBy:
      asString(raw.hrReviewedBy) || asString(raw.hr_reviewed_by) || undefined,
    hrReviewedByName:
      asString(raw.hrReviewedByName) ||
      asString(raw.hr_reviewed_by_name) ||
      undefined,
    hrReviewDate:
      asString(raw.hrReviewDate) || asString(raw.hr_review_date) || undefined,
    hrReviewNotes:
      asString(raw.hrReviewNotes) || asString(raw.hr_review_notes) || undefined,
    approvedBy:
      asString(raw.approvedBy) || asString(raw.approved_by) || undefined,
    approvedByName:
      asString(raw.approvedByName) ||
      asString(raw.approved_by_name) ||
      undefined,
    approvalDate:
      asString(raw.approvalDate) || asString(raw.approval_date) || undefined,
    rejectedBy:
      asString(raw.rejectedBy) || asString(raw.rejected_by) || undefined,
    rejectedByName:
      asString(raw.rejectedByName) ||
      asString(raw.rejected_by_name) ||
      undefined,
    rejectedAt:
      asString(raw.rejectedAt) || asString(raw.rejected_at) || undefined,
    rejectionReason:
      asString(raw.rejectionReason) ||
      asString(raw.rejection_reason) ||
      undefined,
    returnedComments:
      asString(raw.returnedComments) || asString(raw.returned_comments) || undefined,
    returnedAt: asString(raw.returnedAt) || asString(raw.returned_at) || undefined,
    returnedBy: asString(raw.returnedBy) || asString(raw.returned_by) || undefined,
    returnedByName:
      asString(raw.returnedByName) || asString(raw.returned_by_name) || undefined,
    versionNumber: Number(raw.versionNumber ?? raw.version_number ?? 1),
    revisions: Array.isArray(raw.revisions)
      ? (raw.revisions as WorkforcePlan['revisions'])
      : [],
    activities: Array.isArray(raw.activities)
      ? (raw.activities as WorkforcePlan['activities'])
      : [],
    items,
  };
}

function* fetchWorkforcePlanningDataSaga(): Generator {
  try {
    const [plansResponse, departmentsResponse] = yield all([
      call(makeCall, {
        method: 'GET',
        route: API_ROUTES.workforce.plans,
        isSecureRoute: true,
      }),
      call(makeCall, {
        method: 'GET',
        route: API_ROUTES.workforce.departments,
        isSecureRoute: true,
      }),
    ]);

    const planRows: unknown[] = Array.isArray(plansResponse.data?.data)
      ? (plansResponse.data.data as unknown[])
      : [];
    const departments = Array.isArray(departmentsResponse.data?.data)
      ? (departmentsResponse.data.data as unknown[]).map((raw: unknown) => {
          const department = raw as ApiRaw;
          return {
            id: asString(department.id) ?? '',
            name: asString(department.name) ?? '',
          };
        })
      : [];

    yield put(
      workforcePlanningActions.fetchWorkforcePlanningDataSuccess({
        workforcePlans: planRows.map((raw: unknown) =>
          mapApiWorkforcePlan(raw as ApiWorkforcePlanRaw),
        ),
        departments,
      }),
    );
  } catch (error) {
    yield put(
      workforcePlanningActions.fetchWorkforcePlanningDataFailure(
        getErrorMessage(error, 'Could not load workforce planning data.'),
      ),
    );
  }
}

function* submitWorkforcePlanSaga(
  action: PayloadAction<{ planId: string; successMessage: string }>,
) {
  try {
    yield call(submitWorkforcePlan, action.payload.planId);
    yield put(
      workforcePlanningActions.submitWorkforcePlanSuccess(
        action.payload.successMessage,
      ),
    );
    yield put(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
  } catch (error) {
    yield put(
      workforcePlanningActions.submitWorkforcePlanFailure(
        getErrorMessage(error, 'Failed to submit workforce plan.'),
      ),
    );
  }
}

function* approveWorkforcePlanSaga(
  action: PayloadAction<{ planId: string; successMessage: string }>,
) {
  try {
    yield call(approveWorkforcePlan, action.payload.planId);
    yield put(
      workforcePlanningActions.approveWorkforcePlanSuccess(
        action.payload.successMessage,
      ),
    );
    yield put(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
  } catch (error) {
    yield put(
      workforcePlanningActions.approveWorkforcePlanFailure(
        getErrorMessage(error, 'Failed to approve workforce plan.'),
      ),
    );
  }
}

function* forwardWorkforcePlanToCeoSaga(
  action: PayloadAction<{
    planId: string;
    notes?: string;
    successMessage: string;
  }>,
) {
  try {
    yield call(
      forwardWorkforcePlanToCeo,
      action.payload.planId,
      action.payload.notes,
    );
    yield put(
      workforcePlanningActions.forwardWorkforcePlanToCeoSuccess(
        action.payload.successMessage,
      ),
    );
    yield put(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
  } catch (error) {
    yield put(
      workforcePlanningActions.forwardWorkforcePlanToCeoFailure(
        getErrorMessage(error, 'Failed to forward workforce plan to CEO.'),
      ),
    );
  }
}

function* returnWorkforcePlanForRevisionSaga(
  action: PayloadAction<{
    planId: string;
    reason: string;
    successMessage: string;
  }>,
) {
  try {
    yield call(
      returnWorkforcePlanForRevision,
      action.payload.planId,
      action.payload.reason,
    );
    yield put(
      workforcePlanningActions.returnWorkforcePlanForRevisionSuccess(
        action.payload.successMessage,
      ),
    );
    yield put(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
  } catch (error) {
    yield put(
      workforcePlanningActions.returnWorkforcePlanForRevisionFailure(
        getErrorMessage(error, 'Failed to return workforce plan for revision.'),
      ),
    );
  }
}

function* rejectWorkforcePlanSaga(
  action: PayloadAction<{
    planId: string;
    reason: string;
    successMessage: string;
  }>,
) {
  try {
    yield call(
      rejectWorkforcePlan,
      action.payload.planId,
      action.payload.reason,
    );
    yield put(
      workforcePlanningActions.rejectWorkforcePlanSuccess(
        action.payload.successMessage,
      ),
    );
    yield put(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
  } catch (error) {
    yield put(
      workforcePlanningActions.rejectWorkforcePlanFailure(
        getErrorMessage(error, 'Failed to reject workforce plan.'),
      ),
    );
  }
}

export function* workforcePlanningSaga() {
  yield takeLatest(
    workforcePlanningActions.fetchWorkforcePlanningDataRequest.type,
    fetchWorkforcePlanningDataSaga,
  );
  yield takeLatest(
    workforcePlanningActions.submitWorkforcePlanRequest.type,
    submitWorkforcePlanSaga,
  );
  yield takeLatest(
    workforcePlanningActions.forwardWorkforcePlanToCeoRequest.type,
    forwardWorkforcePlanToCeoSaga,
  );
  yield takeLatest(
    workforcePlanningActions.returnWorkforcePlanForRevisionRequest.type,
    returnWorkforcePlanForRevisionSaga,
  );
  yield takeLatest(
    workforcePlanningActions.approveWorkforcePlanRequest.type,
    approveWorkforcePlanSaga,
  );
  yield takeLatest(
    workforcePlanningActions.rejectWorkforcePlanRequest.type,
    rejectWorkforcePlanSaga,
  );
}
