import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { authActions } from '@/slice/authSlice';
import { getErrorMessage } from '@/utils/apiMappers';
import { loginWithFallback } from '../../shared/loginApi';
import { parseLoginResponse } from '../../shared/sessionBridge';
import { authenticationLoginActions } from './index';

function* submitLoginSaga(
  action: ReturnType<typeof authenticationLoginActions.submitLogin>,
) {
  try {
    const response = (yield call(loginWithFallback, action.payload)) as Awaited<
      ReturnType<typeof loginWithFallback>
    >;

    const parsed = response ? parseLoginResponse(response) : null;
    if (!parsed) {
      yield put(
        authenticationLoginActions.submitLoginFailure(
          'Invalid email or password. Please try again.',
        ),
      );
      return;
    }

    yield put(
      authActions.loginSuccess({
        token: parsed.token,
        refreshToken: parsed.refreshToken,
        user: parsed.user,
      }),
    );
    yield put(authenticationLoginActions.submitLoginSuccess());
  } catch (error) {
    yield put(
      authenticationLoginActions.submitLoginFailure(
        getErrorMessage(error, 'Login failed. Please check your credentials.'),
      ),
    );
  }
}

function* submitEmailSigninSaga(
  action: ReturnType<typeof authenticationLoginActions.submitEmailSignin>,
) {
  const email = action.payload;
  try {
    yield call(makeCall, {
      method: 'POST',
      route: '/auth/email-signin',
      body: { email },
      isSecureRoute: false,
    });

    yield put(authenticationLoginActions.submitLoginSuccess());
    // In a real app, you'd show a message that a sign-in link has been sent
    // For now, we'll just clear the form
  } catch (error) {
    yield put(
      authenticationLoginActions.submitLoginFailure(
        getErrorMessage(error, 'Email sign-in failed. Please try again.'),
      ),
    );
  }
}

export function* authenticationLoginSaga() {
  yield takeLatest(
    authenticationLoginActions.submitLogin.type,
    submitLoginSaga,
  );
  yield takeLatest(
    authenticationLoginActions.submitEmailSignin.type,
    submitEmailSigninSaga,
  );
}
