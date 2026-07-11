import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { mapApiApplication } from '../api';
import { screeningActions } from './index';

function* fetchScreeningSaga() {
  try {
    const { data } = yield call(makeCall<{ status: string; data: unknown[] }>, {
      method: 'GET',
      route: API_ROUTES.candidates.screeningApplications,
      isSecureRoute: true,
    });

    const rows = Array.isArray(data?.data) ? data.data : [];
    const applications = rows.map((row: any) =>
      mapApiApplication(row as Record<string, unknown>),
    );

    yield put(screeningActions.fetchScreeningSuccess(applications));
  } catch (error) {
    yield put(
      screeningActions.fetchScreeningFailure(
        getErrorMessage(error, 'Unable to load screening applications.'),
      ),
    );
  }
}

function* updateApplicationStatusSaga(
  action:
    | ReturnType<typeof screeningActions.shortlistApplicationRequest>
    | ReturnType<typeof screeningActions.rejectApplicationRequest>,
) {
  try {
    const payload = action.payload as unknown as {
      applicationId: string;
      status: string;
      currentStage?: string;
      notes?: string;
      rejectionReason?: string;
      addToTalentRoster?: boolean;
      futureFitTag?: string;
      screeningCriteria?: unknown;
    };
    yield call(makeCall<{ status: string; data: unknown }>, {
      method: 'PATCH',
      route: API_ROUTES.interviews.applicationStatus,
      body: {
        application_id: payload.applicationId,
        status: payload.status,
        current_stage: payload.currentStage,
        notes: payload.notes,
        rejection_reason: payload.rejectionReason,
        add_to_talent_roster: payload.addToTalentRoster,
        future_fit_tag: payload.futureFitTag,
        screening_criteria_json: payload.screeningCriteria,
      },
      isSecureRoute: true,
    });

    if (payload.status === 'shortlisted') {
      yield put(
        screeningActions.shortlistApplicationSuccess(payload.applicationId),
      );
    } else {
      yield put(
        screeningActions.rejectApplicationSuccess({
          applicationId: payload.applicationId,
          addToTalentRoster:
            payload.addToTalentRoster ||
            payload.status === 'moved_to_talent_roster',
        }),
      );
    }
  } catch (error) {
    const message = getErrorMessage(
      error,
      'Could not update application status.',
    );
    if (action.type === screeningActions.shortlistApplicationRequest.type) {
      yield put(screeningActions.shortlistApplicationFailure(message));
    } else {
      yield put(screeningActions.rejectApplicationFailure(message));
    }
  }
}

export function* screeningSaga() {
  yield takeLatest(
    screeningActions.fetchScreeningRequest.type,
    fetchScreeningSaga,
  );
  yield takeLatest(
    screeningActions.shortlistApplicationRequest.type,
    updateApplicationStatusSaga,
  );
  yield takeLatest(
    screeningActions.rejectApplicationRequest.type,
    updateApplicationStatusSaga,
  );
}
