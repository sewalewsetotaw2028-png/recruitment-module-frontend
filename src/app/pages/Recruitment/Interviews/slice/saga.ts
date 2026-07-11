import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { mapApiInterview } from '../api';
import { interviewsActions } from './index';
import type { ScheduleInterviewRequest, RescheduleInterviewRequest } from './types';



function* fetchInterviewsSaga() {

  try {

    const { data } = yield call(makeCall<{ status: string; data: unknown[] }>, {

      method: 'GET',

      route: API_ROUTES.interviews.list,

      isSecureRoute: true,

    });



    const rows = Array.isArray(data?.data) ? data.data : [];

    const interviews = rows.map((row) =>

      mapApiInterview(row as Record<string, unknown>),

    );



    yield put(interviewsActions.fetchInterviewsSuccess(interviews));

  } catch (error) {

    yield put(

      interviewsActions.fetchInterviewsFailure(

        getErrorMessage(error, 'Unable to load interviews.'),

      ),

    );

  }

}



function* scheduleInterviewSaga(

  action: PayloadAction<ScheduleInterviewRequest>,

) {

  try {

    const {

      applicationId,

      type,

      startTime,

      endTime,

      location,

      meetingLink,

      panelIds,

      questionTexts,
      inOfficeStartTime,
      inOfficeEndTime,
      remoteStartTime,
      remoteEndTime,
      interviewCategoryId,

    } = action.payload;

    const payload = {
      application_id: applicationId,
      round: 1,
      type,
      start_time: startTime,
      end_time: endTime,
      office_location: location,
      meeting_link: meetingLink,
      panel_member_ids: panelIds,
      in_office_start_time: inOfficeStartTime,
      in_office_end_time: inOfficeEndTime,
      remote_start_time: remoteStartTime,
      remote_end_time: remoteEndTime,
      interview_category_id: interviewCategoryId,
      questions_json: questionTexts?.length
        ? questionTexts.map((question) => ({ question }))
        : undefined,
    };

    console.log('Scheduling interview with payload:', JSON.stringify(payload, null, 2));

    yield call(makeCall<{ status: string; data: unknown }>, {

      method: 'POST',

      route: API_ROUTES.interviews.create,

      isSecureRoute: true,

      body: payload,

    });



    yield put(

      interviewsActions.scheduleInterviewSuccess(

        'Interview scheduled successfully.',

      ),

    );

    yield put(interviewsActions.fetchInterviewsRequest());

  } catch (error) {

    yield put(

      interviewsActions.scheduleInterviewFailure(

        getErrorMessage(error, 'Failed to schedule interview.'),

      ),

    );

  }

}



function* rescheduleInterviewSaga(action: PayloadAction<RescheduleInterviewRequest>) {
  try {
    const { interviewId, startTime, endTime, reason, meetingLink, location } = action.payload;
    yield call(makeCall<{ status: string; data: unknown }>, {
      method: 'PUT',
      route: API_ROUTES.interviews.byId(interviewId),
      isSecureRoute: true,
      body: {
        start_time: startTime,
        end_time: endTime,
        rescheduled_reason: reason,
        meeting_link: meetingLink,
        office_location: location,
      },
    });
    yield put(interviewsActions.rescheduleInterviewSuccess('Interview rescheduled successfully.'));
    yield put(interviewsActions.fetchInterviewsRequest());
  } catch (error) {
    yield put(
      interviewsActions.rescheduleInterviewFailure(
        getErrorMessage(error, 'Failed to reschedule interview.'),
      ),
    );
  }
}

function* cancelInterviewSaga(action: PayloadAction<string>) {
  try {
    const interviewId = action.payload;
    yield call(makeCall<{ status: string; data: unknown }>, {
      method: 'POST',
      route: API_ROUTES.interviews.cancel(interviewId),
      isSecureRoute: true,
      body: {},
    });
    yield put(interviewsActions.cancelInterviewSuccess('Interview cancelled.'));
    yield put(interviewsActions.fetchInterviewsRequest());
  } catch (error) {
    yield put(
      interviewsActions.cancelInterviewFailure(
        getErrorMessage(error, 'Failed to cancel interview.'),
      ),
    );
  }
}

export function* interviewsSaga() {
  yield takeLatest(
    interviewsActions.fetchInterviewsRequest.type,
    fetchInterviewsSaga,
  );
  yield takeLatest(
    interviewsActions.scheduleInterviewRequest.type,
    scheduleInterviewSaga,
  );
  yield takeLatest(
    interviewsActions.rescheduleInterviewRequest.type,
    rescheduleInterviewSaga,
  );
  yield takeLatest(
    interviewsActions.cancelInterviewRequest.type,
    cancelInterviewSaga,
  );
}

