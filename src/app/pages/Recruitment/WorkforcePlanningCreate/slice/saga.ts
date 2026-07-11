import { call, put, takeLatest } from 'redux-saga/effects';
import { getErrorMessage } from '@/utils/apiMappers';
import { workforcePlanningCreateActions } from './index';
import { createWorkforcePlan as createWorkforcePlanApi } from '../../WorkforcePlanning/api';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { WorkforcePlanFormPayload } from '@/types';

function* createWorkforcePlanSaga(
  action: PayloadAction<{
    payload: WorkforcePlanFormPayload;
    status: 'draft' | 'submitted';
  }>,
): Generator<unknown, void, unknown> {
  try {
    const plan = (yield call(
      createWorkforcePlanApi,
      action.payload.payload,
      action.payload.status,
    )) as { id: string };
    yield put(
      workforcePlanningCreateActions.createWorkforcePlanSuccess(plan.id),
    );
  } catch (error) {
    yield put(
      workforcePlanningCreateActions.createWorkforcePlanFailure(
        getErrorMessage(error, 'Failed to save workforce plan.'),
      ),
    );
  }
}

export function* workforcePlanningCreateSaga() {
  yield takeLatest(
    workforcePlanningCreateActions.createWorkforcePlanRequest.type,
    createWorkforcePlanSaga,
  );
}
