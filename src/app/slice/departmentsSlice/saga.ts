import { call, put, takeLatest } from 'redux-saga/effects';
import { departmentsActions } from './index';
import { fetchWorkforceDepartments } from '@/pages/Recruitment/WorkforcePlanning/api';
import { getErrorMessage } from '@/utils/apiMappers';

function* fetchDepartmentsSaga(): Generator {
  try {
    const departments = yield call(fetchWorkforceDepartments);
    yield put(departmentsActions.fetchDepartmentsSuccess(departments));
  } catch (error) {
    yield put(
      departmentsActions.fetchDepartmentsFailure(
        getErrorMessage(error, 'Could not load departments.'),
      ),
    );
  }
}

export function* departmentsSaga() {
  yield takeLatest(
    departmentsActions.fetchDepartmentsRequest.type,
    fetchDepartmentsSaga,
  );
}
