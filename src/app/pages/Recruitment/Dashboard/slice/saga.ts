import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchReportingDashboard } from '../api';
import { recruitmentDashboardActions } from './index';
import { getErrorMessage } from '@/utils/apiMappers';

function* fetchDashboardSaga(action: any) {
  try {
    const { period, startDate, endDate, departmentId, vacancyId } = action.payload || {};
    const stats: Awaited<ReturnType<typeof fetchReportingDashboard>> = yield call(fetchReportingDashboard, {
      period,
      startDate,
      endDate,
      departmentId,
      vacancyId,
    });
    yield put(
      recruitmentDashboardActions.fetchDashboardSuccess({
        summary: stats.summary,
        pipeline: stats.pipeline,
        sourcing: stats.sourcing,
        kpis: stats.kpis,
        trends: (stats as any).trends,
      }),
    );
  } catch (error) {
    yield put(
      recruitmentDashboardActions.fetchDashboardFailure(
        getErrorMessage(error, 'Could not load recruitment dashboard.'),
      ),
    );
  }
}

export function* recruitmentDashboardSaga() {
  yield takeLatest(
    recruitmentDashboardActions.fetchDashboardRequest.type,
    fetchDashboardSaga,
  );
}
