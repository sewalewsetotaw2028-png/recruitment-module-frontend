import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { authenticationSignupActions } from './index';

function* submitSignupSaga(
  action: ReturnType<typeof authenticationSignupActions.submitSignup>,
) {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    termsAccepted,
  } = action.payload;
  try {
    yield call(makeCall, {
      method: 'POST',
      route: API_ROUTES.candidates.register,
      body: {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        terms_accepted: termsAccepted,
      },
      isSecureRoute: false,
    });

    // Registration successful — show signup success with the email so the
    // UI can redirect to the email verification pending page.
    // The user is NOT auto-logged in; they must verify their email first.
    yield put(authenticationSignupActions.submitSignupSuccess());
  } catch (error) {
    yield put(
      authenticationSignupActions.submitSignupFailure(
        getErrorMessage(error, 'Registration failed. Please try again.'),
      ),
    );
  }
}

function* submitEmailSigninSaga(
  action: ReturnType<typeof authenticationSignupActions.submitEmailSignin>,
) {
  const email = action.payload;
  try {
    yield call(makeCall, {
      method: 'POST',
      route: '/auth/email-signin',
      body: { email },
      isSecureRoute: false,
    });

    yield put(authenticationSignupActions.submitSignupSuccess());
    // In a real app, you'd show a message that a sign-in link has been sent
    // For now, we'll just clear the form
  } catch (error) {
    yield put(
      authenticationSignupActions.submitSignupFailure(
        getErrorMessage(error, 'Email sign-in failed. Please try again.'),
      ),
    );
  }
}

export function* authenticationSignupSaga() {
  yield takeLatest(
    authenticationSignupActions.submitSignup.type,
    submitSignupSaga,
  );
  yield takeLatest(
    authenticationSignupActions.submitEmailSignin.type,
    submitEmailSigninSaga,
  );
}
