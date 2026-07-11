import { all, fork } from 'redux-saga/effects';
import { authSaga } from '@/slice/authSlice/saga';
import { uiSaga } from '@/slice/uiSlice/saga';
import { recruitmentDataSaga } from '@/slice/recruitmentDataSlice/saga';

export function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(uiSaga),
    fork(recruitmentDataSaga),
  ]);
}
