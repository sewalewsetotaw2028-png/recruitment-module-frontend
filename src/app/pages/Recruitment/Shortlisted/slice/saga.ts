import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { mapApiApplication } from '../../Screening/api';
import { shortlistedActions } from './index';

function* fetchShortlistedSaga() {
  try {
    const { data } = yield call(makeCall<{ status: string; data: unknown[] }>, {
      method: 'GET',
      route: API_ROUTES.candidates.shortlistedApplications,
      isSecureRoute: true,
    });

    const rows = Array.isArray(data?.data) ? data.data : [];
    // Backend already filters for SHORTLISTED status — map all returned rows
    const applications = rows.map((row) =>
      mapApiApplication(row as Record<string, unknown>),
    );

    yield put(shortlistedActions.fetchShortlistedSuccess(applications));
  } catch (error) {
    yield put(
      shortlistedActions.fetchShortlistedFailure(
        getErrorMessage(error, 'Unable to load shortlisted applications.'),
      ),
    );
  }
}

export function* shortlistedSaga() {
  yield takeLatest(
    shortlistedActions.fetchShortlistedRequest.type,
    fetchShortlistedSaga,
  );
}
