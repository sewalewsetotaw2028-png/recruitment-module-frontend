import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { mapApiApplication } from '../../Screening/api';
import { kanbanActions } from './index';

function* fetchKanbanSaga() {
  try {
    const { data } = yield call(makeCall<{ status: string; data: unknown[] }>, {
      method: 'GET',
      route: API_ROUTES.candidates.applications,
      isSecureRoute: true,
    });

    const rows = Array.isArray(data?.data) ? data.data : [];
    const applications = rows.map((row) =>
      mapApiApplication(row as Record<string, unknown>),
    );

    yield put(kanbanActions.fetchKanbanSuccess(applications));
  } catch (error) {
    yield put(
      kanbanActions.fetchKanbanFailure(
        getErrorMessage(error, 'Unable to load kanban pipeline.'),
      ),
    );
  }
}

export function* kanbanSaga() {
  yield takeLatest(kanbanActions.fetchKanbanRequest.type, fetchKanbanSaga);
}
