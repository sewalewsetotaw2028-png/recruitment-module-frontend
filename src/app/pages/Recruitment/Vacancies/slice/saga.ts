import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getErrorMessage } from '@/utils/apiMappers';
import type { Vacancy } from '@/types';
import { vacanciesActions } from './index';
import {
  approveVacancyPosting,
  closeVacancy,
  createVacancy,
  fetchVacancies,
  holdVacancy,
  postVacancy,
  rejectVacancyPosting,
  resumeVacancy,
  setVacancyStatus,
  unpostVacancy,
  updateVacancy,
} from '../api';

function* fetchVacanciesSaga(): Generator {
  try {
    const vacancies = yield call(fetchVacancies);
    yield put(vacanciesActions.fetchVacanciesSuccess(vacancies as any));
  } catch (error) {
    yield put(
      vacanciesActions.fetchVacanciesFailure(
        getErrorMessage(error, 'Failed to load vacancies.'),
      ),
    );
  }
}

function* createVacancySaga(action: PayloadAction<Partial<Vacancy>>): Generator {
  try {
    const recruitmentRequestId = action.payload?.recruitmentRequestId as string;

    // Manual drafts (no linked request) cannot be persisted to the backend
    // because the backend requires a valid recruitment_request_id.
    // Store them optimistically in local Redux state only.
    if (!recruitmentRequestId) {
      yield put(vacanciesActions.createVacancySuccess('Draft created locally.'));
      return;
    }

    yield call(createVacancy, action.payload);
    yield put(vacanciesActions.createVacancySuccess('Vacancy created.'));
    yield put(vacanciesActions.fetchVacanciesRequest());
  } catch (error) {
    yield put(
      vacanciesActions.createVacancyFailure(
        getErrorMessage(error, 'Failed to create vacancy.'),
      ),
    );
  }
}

function* updateVacancySaga(
  action: PayloadAction<{ vacancyId: string; payload: Partial<Vacancy> }>,
): Generator {
  try {
    const vacancy = yield call(
      updateVacancy,
      action.payload.vacancyId,
      action.payload.payload,
    );
    yield put(vacanciesActions.updateVacancySuccess(vacancy as any));
  } catch (error) {
    yield put(
      vacanciesActions.updateVacancyFailure(
        getErrorMessage(error, 'Failed to update vacancy.'),
      ),
    );
  }
}

function* postVacancySaga(action: PayloadAction<string>): Generator {
  try {
    yield call(postVacancy, action.payload);
    yield put(vacanciesActions.postVacancySuccess('Vacancy published.'));
    yield put(vacanciesActions.fetchVacanciesRequest());
  } catch (error) {
    yield put(
      vacanciesActions.postVacancyFailure(
        getErrorMessage(error, 'Failed to publish vacancy.'),
      ),
    );
  }
}

function* unpostVacancySaga(action: PayloadAction<string>): Generator {
  try {
    yield call(unpostVacancy, action.payload);
    yield put(vacanciesActions.unpostVacancySuccess('Vacancy unpublished.'));
    yield put(vacanciesActions.fetchVacanciesRequest());
  } catch (error) {
    yield put(
      vacanciesActions.unpostVacancyFailure(
        getErrorMessage(error, 'Failed to unpublish vacancy.'),
      ),
    );
  }
}

function* closeVacancySaga(action: PayloadAction<string>): Generator {
  try {
    yield call(closeVacancy, action.payload);
    yield put(vacanciesActions.closeVacancySuccess('Vacancy closed.'));
    yield put(vacanciesActions.fetchVacanciesRequest());
  } catch (error) {
    yield put(
      vacanciesActions.closeVacancyFailure(
        getErrorMessage(error, 'Failed to close vacancy.'),
      ),
    );
  }
}

function* approveVacancyPostingSaga(
  action: PayloadAction<{ vacancyId: string; notes?: string }>,
): Generator {
  try {
    yield call(
      approveVacancyPosting,
      action.payload.vacancyId,
      action.payload.notes,
    );
    yield put(
      vacanciesActions.approveVacancyPostingSuccess(
        'Vacancy posting approved.',
      ),
    );
    yield put(vacanciesActions.fetchVacanciesRequest());
  } catch (error) {
    yield put(
      vacanciesActions.approveVacancyPostingFailure(
        getErrorMessage(error, 'Failed to approve vacancy posting.'),
      ),
    );
  }
}

function* rejectVacancyPostingSaga(
  action: PayloadAction<{ vacancyId: string; reason: string }>,
): Generator {
  try {
    yield call(
      rejectVacancyPosting,
      action.payload.vacancyId,
      action.payload.reason,
    );
    yield put(
      vacanciesActions.rejectVacancyPostingSuccess(
        'Vacancy posting rejected.',
      ),
    );
    yield put(vacanciesActions.fetchVacanciesRequest());
  } catch (error) {
    yield put(
      vacanciesActions.rejectVacancyPostingFailure(
        getErrorMessage(error, 'Failed to reject vacancy posting.'),
      ),
    );
  }
}

function* holdVacancySaga(action: PayloadAction<string>): Generator {
  try {
    const vacancy = yield call(holdVacancy, action.payload);
    yield put(vacanciesActions.holdVacancySuccess(vacancy as any));
  } catch (error) {
    yield put(
      vacanciesActions.holdVacancyFailure(
        getErrorMessage(error, 'Failed to put vacancy on hold.'),
      ),
    );
  }
}

function* resumeVacancySaga(action: PayloadAction<string>): Generator {
  try {
    const vacancy = yield call(resumeVacancy, action.payload);
    yield put(vacanciesActions.resumeVacancySuccess(vacancy as any));
  } catch (error) {
    yield put(
      vacanciesActions.resumeVacancyFailure(
        getErrorMessage(error, 'Failed to resume vacancy.'),
      ),
    );
  }
}

function* setVacancyStatusSaga(
  action: PayloadAction<{ vacancyId: string; status: string }>,
): Generator {
  try {
    const vacancy = yield call(
      setVacancyStatus,
      action.payload.vacancyId,
      action.payload.status,
    );
    yield put(vacanciesActions.setVacancyStatusSuccess(vacancy as any));
  } catch (error) {
    yield put(
      vacanciesActions.setVacancyStatusFailure(
        getErrorMessage(error, 'Failed to update vacancy status.'),
      ),
    );
  }
}

export function* vacanciesSaga() {
  yield takeLatest(vacanciesActions.fetchVacanciesRequest.type, fetchVacanciesSaga);
  yield takeLatest(vacanciesActions.createVacancyRequest.type, createVacancySaga);
  yield takeLatest(vacanciesActions.updateVacancyRequest.type, updateVacancySaga);
  yield takeLatest(vacanciesActions.postVacancyRequest.type, postVacancySaga);
  yield takeLatest(vacanciesActions.unpostVacancyRequest.type, unpostVacancySaga);
  yield takeLatest(vacanciesActions.closeVacancyRequest.type, closeVacancySaga);
  yield takeLatest(vacanciesActions.holdVacancyRequest.type, holdVacancySaga);
  yield takeLatest(vacanciesActions.resumeVacancyRequest.type, resumeVacancySaga);
  yield takeLatest(
    vacanciesActions.setVacancyStatusRequest.type,
    setVacancyStatusSaga,
  );
  yield takeLatest(
    vacanciesActions.approveVacancyPostingRequest.type,
    approveVacancyPostingSaga,
  );
  yield takeLatest(
    vacanciesActions.rejectVacancyPostingRequest.type,
    rejectVacancyPostingSaga,
  );
}
