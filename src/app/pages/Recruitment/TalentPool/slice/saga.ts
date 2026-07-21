import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import {
  fetchTalentPoolEntries,
  linkCandidateToVacancy,
  getAllRosterActivity,
  getRosterHistory,
  removeFromRoster,
} from '../api';
import { getErrorMessage } from '@/utils/apiMappers';
import { talentPoolActions } from './index';

function* fetchTalentPoolSaga(): Generator {
  try {
    const entries = yield call(fetchTalentPoolEntries);
    yield put(talentPoolActions.fetchTalentPoolSuccess(entries));
  } catch (error) {
    yield put(
      talentPoolActions.fetchTalentPoolFailure(
        getErrorMessage(error, 'Unable to load talent pool.'),
      ),
    );
  }
}

function* linkCandidateToVacancySaga(action: any): Generator {
  try {
    const result = yield call(
      linkCandidateToVacancy,
      action.payload.rosterId,
      action.payload.vacancyId,
    );
    yield put(
      talentPoolActions.linkCandidateToVacancySuccess({
        result,
        rosterId: action.payload.rosterId,
      }),
    );
    yield put(talentPoolActions.fetchTalentPoolRequest());
  } catch (error) {
    yield put(
      talentPoolActions.linkCandidateToVacancyFailure(
        getErrorMessage(error, 'Unable to link candidate to vacancy.'),
      ),
    );
  }
}

/** Company-wide activity log — used by the View History button */
function* fetchAllRosterActivitySaga(): Generator {
  try {
    const result = yield call(getAllRosterActivity);
    // result = { status: 'success', data: { activityLogs, summary } }
    const payload = (result as any)?.data ?? result;
    yield put(talentPoolActions.fetchAllRosterActivitySuccess(payload));
  } catch (error) {
    yield put(
      talentPoolActions.fetchAllRosterActivityFailure(
        getErrorMessage(error, 'Unable to load roster activity.'),
      ),
    );
  }
}

/** Per-candidate history — kept for future candidate-specific drill-down */
function* getRosterHistorySaga(action: any): Generator {
  try {
    const result = yield call(getRosterHistory, action.payload);
    const payload = (result as any)?.data ?? result;
    yield put(talentPoolActions.getRosterHistorySuccess(payload));
  } catch (error) {
    yield put(
      talentPoolActions.getRosterHistoryFailure(
        getErrorMessage(error, 'Unable to load roster history.'),
      ),
    );
  }
}

function* removeFromRosterSaga(action: any): Generator {
  try {
    const { rosterId, reason } = action.payload;
    const result = yield call(removeFromRoster, rosterId, reason);
    yield put(talentPoolActions.removeFromRosterSuccess(result));
    yield put(talentPoolActions.fetchTalentPoolRequest());
  } catch (error) {
    yield put(
      talentPoolActions.removeFromRosterFailure(
        getErrorMessage(error, 'Unable to remove from roster.'),
      ),
    );
  }
}

/**
 * scheduleInterviewFromRoster:
 * 1. Calls linkCandidateToVacancy to ensure an application exists (gets real ID).
 * 2. POSTs to POST /api/v1/interviews with the correct field names.
 */
function* scheduleInterviewFromRosterSaga(action: any): Generator {
  try {
    const {
      rosterId,
      vacancyId,
      type,
      startTime,
      endTime,
      location,
      meetingLink,
      panelIds,
      questionTexts,
    } = action.payload;

    // Step 1 — get/create the application for this roster+vacancy pair
    const linkResult = yield call(linkCandidateToVacancy, rosterId, vacancyId);
    // api.ts returns the full response body: { status, data: application }
    const applicationObj = (linkResult as any)?.data ?? linkResult;
    const applicationId: string =
      applicationObj?.id ?? applicationObj;

    if (!applicationId || typeof applicationId !== 'string') {
      throw new Error('Could not resolve application ID from roster link.');
    }

    // Step 2 — schedule the interview
    yield call(makeCall, {
      method: 'POST',
      route: API_ROUTES.interviews.create,
      isSecureRoute: true,
      body: {
        application_id: applicationId,
        round: 1,
        type,
        start_time: startTime,
        end_time: endTime,
        office_location: location || undefined,
        meeting_link: meetingLink || undefined,
        panel_member_ids: panelIds,
        questions_json: questionTexts?.length
          ? questionTexts.map((q: string) => ({ question: q }))
          : undefined,
      },
    });

    yield put(
      talentPoolActions.scheduleInterviewFromRosterSuccess(
        'Interview scheduled. Check the Interviews page for the upcoming schedule.',
      ),
    );

    // Keep candidate on roster — just refresh the list
    yield put(talentPoolActions.fetchTalentPoolRequest());
  } catch (error) {
    yield put(
      talentPoolActions.scheduleInterviewFromRosterFailure(
        getErrorMessage(error, 'Unable to schedule interview.'),
      ),
    );
  }
}

export function* talentPoolSaga() {
  yield takeLatest(talentPoolActions.fetchTalentPoolRequest.type, fetchTalentPoolSaga);
  yield takeLatest(talentPoolActions.linkCandidateToVacancyRequest.type, linkCandidateToVacancySaga);
  yield takeLatest(talentPoolActions.fetchAllRosterActivityRequest.type, fetchAllRosterActivitySaga);
  yield takeLatest(talentPoolActions.getRosterHistoryRequest.type, getRosterHistorySaga);
  yield takeLatest(talentPoolActions.removeFromRosterRequest.type, removeFromRosterSaga);
  yield takeLatest(talentPoolActions.scheduleInterviewFromRosterRequest.type, scheduleInterviewFromRosterSaga);
}
