import { all, call, put, takeLatest } from 'redux-saga/effects';
import { getErrorMessage } from '@/utils/apiMappers';
import {
  approveWorkforcePlan,
  forwardWorkforcePlanToCeo,
  rejectWorkforcePlan,
  returnWorkforcePlanForRevision,
  submitWorkforcePlan,
  fetchWorkforcePlans,
  fetchWorkforceDepartments,
} from '../../WorkforcePlanning/api';
import { workforcePlanningActions } from './index';
import type { PayloadAction } from '@reduxjs/toolkit';

function* fetchWorkforcePlanningDataSaga(): Generator {
  try {
    const [plans, departments] = yield all([
      call(fetchWorkforcePlans),
      call(fetchWorkforceDepartments),
    ]);

    yield put(
      workforcePlanningActions.fetchWorkforcePlanningDataSuccess({
        workforcePlans: plans,
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
