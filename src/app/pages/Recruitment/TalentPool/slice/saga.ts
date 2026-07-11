// @ts-nocheck
import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchTalentPoolEntries } from '../api';
import { getErrorMessage } from '@/utils/apiMappers';
import { talentPoolActions } from './index';

function* fetchTalentPoolSaga() {
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

export function* talentPoolSaga() {
  yield takeLatest(
    talentPoolActions.fetchTalentPoolRequest.type,
    fetchTalentPoolSaga,
  );
}
