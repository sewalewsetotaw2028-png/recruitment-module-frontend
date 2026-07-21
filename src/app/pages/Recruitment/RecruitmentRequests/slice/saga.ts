import { all, call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import type { RecruitmentRequest } from '@/types';
import {
  approveRecruitmentRequest,
  createRecruitmentRequest,
  deleteRecruitmentRequest,
  fetchRecruitmentRequests,
  hrReviewRecruitmentRequest,
  rejectRecruitmentRequest,
  submitRecruitmentRequest,
  updateRecruitmentRequest,
} from '../api';
import { recruitmentRequestsActions } from './index';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RecruitmentRequestPayload } from '../api';

function* fetchRequestsSaga(): Generator {
  try {
    const [requests, departmentsResponse] = yield all([
      call(fetchRecruitmentRequests),
      call(makeCall, {
        method: 'GET',
        route: API_ROUTES.workforce.departments,
        isSecureRoute: true,
      }),
    ]);

    const departments = Array.isArray((departmentsResponse as any).data?.data)
      ? (departmentsResponse as any).data.data.map((department: any) => ({
          id: String(department.id ?? ''),
          name: String(department.name ?? ''),
        }))
      : [];

    yield put(
      recruitmentRequestsActions.fetchRequestsSuccess({
        requests: requests as any,
        departments,
      }),
    );
  } catch (error) {
    yield put(
      recruitmentRequestsActions.fetchRequestsFailure(
        getErrorMessage(error, 'Could not load recruitment requests.'),
      ),
    );
  }
}

function* createRequestSaga(
  action: PayloadAction<{
    data: RecruitmentRequestPayload;
    status: 'draft' | 'submitted';
  }>,
) {
  try {
    const created: RecruitmentRequest = yield call(
      createRecruitmentRequest,
      action.payload.data,
      action.payload.status,
    );
    // Encode id into the success payload so the Hub can upload the document
    yield put(
      recruitmentRequestsActions.createRequestSuccess(
        `${created.id}:Request created.`,
      ),
    );
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.createRequestFailure(
        getErrorMessage(error, 'Failed to create request.'),
      ),
    );
  }
}

function* updateRequestSaga(
  action: PayloadAction<{
    requestId: string;
    data: RecruitmentRequestPayload;
    options?: {
      saveAsDraft?: boolean;
      submit?: boolean;
    };
  }>,
) {
  try {
    yield call(
      updateRecruitmentRequest,
      action.payload.requestId,
      action.payload.data,
    );
    if (action.payload.options?.submit) {
      yield call(submitRecruitmentRequest, action.payload.requestId);
    }
    yield put(recruitmentRequestsActions.updateRequestSuccess('Request updated.'));
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.updateRequestFailure(
        getErrorMessage(error, 'Failed to update request.'),
      ),
    );
  }
}

function* hrReviewRequestSaga(
  action: PayloadAction<{
    requestId: string;
    action: 'approve' | 'reject';
    notes?: string;
  }>,
) {
  try {
    yield call(
      hrReviewRecruitmentRequest,
      action.payload.requestId,
      action.payload.action,
      action.payload.notes,
    );
    yield put(
      recruitmentRequestsActions.hrReviewRequestSuccess(
        action.payload.action === 'reject'
          ? 'Request rejected.'
          : 'Request forwarded to CEO.',
      ),
    );
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.hrReviewRequestFailure(
        getErrorMessage(error, 'Failed to review request.'),
      ),
    );
  }
}

function* approveRequestSaga(
  action: PayloadAction<{ requestId: string; notes?: string }>,
) {
  try {
    yield call(approveRecruitmentRequest, action.payload.requestId, action.payload.notes);
    yield put(
      recruitmentRequestsActions.approveRequestSuccess('Request approved.'),
    );
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.approveRequestFailure(
        getErrorMessage(error, 'Failed to approve request.'),
      ),
    );
  }
}

function* rejectRequestSaga(
  action: PayloadAction<{ requestId: string; reason: string }>,
) {
  try {
    yield call(
      rejectRecruitmentRequest,
      action.payload.requestId,
      action.payload.reason,
    );
    yield put(
      recruitmentRequestsActions.rejectRequestSuccess('Request rejected.'),
    );
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.rejectRequestFailure(
        getErrorMessage(error, 'Failed to reject request.'),
      ),
    );
  }
}

function* submitRequestSaga(
  action: PayloadAction<{ requestId: string }>,
) {
  try {
    yield call(submitRecruitmentRequest, action.payload.requestId);
    yield put(
      recruitmentRequestsActions.submitRequestSuccess('Request submitted.'),
    );
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.submitRequestFailure(
        getErrorMessage(error, 'Failed to submit request.'),
      ),
    );
  }
}

function* deleteRequestSaga(
  action: PayloadAction<{ requestId: string }>,
) {
  try {
    yield call(deleteRecruitmentRequest, action.payload.requestId);
    yield put(recruitmentRequestsActions.deleteRequestSuccess('Request deleted.'));
    yield put(recruitmentRequestsActions.fetchRequestsRequest());
  } catch (error) {
    yield put(
      recruitmentRequestsActions.deleteRequestFailure(
        getErrorMessage(error, 'Failed to delete request.'),
      ),
    );
  }
}

export function* recruitmentRequestsSaga() {
  yield takeLatest(
    recruitmentRequestsActions.fetchRequestsRequest.type,
    fetchRequestsSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.createRequestRequest.type,
    createRequestSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.updateRequestRequest.type,
    updateRequestSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.hrReviewRequestRequest.type,
    hrReviewRequestSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.approveRequestRequest.type,
    approveRequestSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.rejectRequestRequest.type,
    rejectRequestSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.submitRequestRequest.type,
    submitRequestSaga,
  );
  yield takeLatest(
    recruitmentRequestsActions.deleteRequestRequest.type,
    deleteRequestSaga,
  );
}
