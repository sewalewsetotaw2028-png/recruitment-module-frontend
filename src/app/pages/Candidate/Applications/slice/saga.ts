import { all, call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { mapApiCandidateApplication, mapApiCandidateInterview } from '../api';
import { candidateApplicationsActions } from './index';

function* fetchApplicationsSaga(): Generator {
  try {
    const [applicationsRes, interviewsRes] = yield all([
      call(makeCall<{ status: string; data: unknown[] }>, {
        method: 'GET',
        route: API_ROUTES.candidates.applications,
        isSecureRoute: true,
      }),
      call(makeCall<{ status: string; data: unknown[] }>, {
        method: 'GET',
        route: API_ROUTES.candidates.interviews,
        isSecureRoute: true,
      }),
    ]);

    const applicationRows = Array.isArray(applicationsRes?.data?.data)
      ? applicationsRes.data.data
      : [];
    const applications = applicationRows.map((row: Record<string, unknown>) =>
      mapApiCandidateApplication(row as Record<string, unknown>),
    );
    const interviewRows = Array.isArray(interviewsRes?.data?.data)
      ? interviewsRes.data.data
      : [];
    const interviews = interviewRows.map((row: Record<string, unknown>) =>
      mapApiCandidateInterview(row as Record<string, unknown>),
    );

    yield put(
      candidateApplicationsActions.fetchApplicationsSuccess({
        applications,
        interviews,
      }),
    );
  } catch (error) {
    yield put(
      candidateApplicationsActions.fetchApplicationsFailure(
        getErrorMessage(error, 'Could not load your applications.'),
      ),
    );
  }
}

export function* candidateApplicationsSaga() {
  yield takeLatest(
    candidateApplicationsActions.fetchApplicationsRequest.type,
    fetchApplicationsSaga,
  );
}
