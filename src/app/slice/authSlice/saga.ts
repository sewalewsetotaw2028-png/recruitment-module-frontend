import { call, put, select, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import {
  getErrorMessage,
  mapApiUserToAuthUser,
  type ApiUserPayload,
} from '@/utils/apiMappers';
import { mapCandidateProfileToAuthUser } from '@/utils/roleUtils';
import { authActions } from './index';
import { selectAuthRefreshToken } from './selectors';
import type { AuthMeApiResponse, AuthUser } from './types';

/** Step 2 — session bootstrap: resolve staff via /auth/me, candidates via /candidates/me */

function* fetchStaffMe() {
  const { data } = yield call(makeCall<AuthMeApiResponse>, {
    method: 'GET',
    route: API_ROUTES.auth.me,
    isSecureRoute: true,
  });
  if (data?.data) {
    return mapApiUserToAuthUser(data.data);
  }
  return null;
}

function* fetchCandidateMe() {
  const { data } = yield call(
    makeCall<{ status: string; data: Record<string, unknown> }>,
    {
      method: 'GET',
      route: API_ROUTES.candidates.me,
      isSecureRoute: true,
    },
  );
  if (data?.data) {
    return mapCandidateProfileToAuthUser(data.data);
  }
  return null;
}

function* getMeSaga() {
  const token = localStorage.getItem('token');
  if (!token) {
    yield put(authActions.setLoading(false));
    return;
  }

  const storedRole = localStorage.getItem('user');
  let preferCandidate = false;
  if (storedRole) {
    try {
      const parsed = JSON.parse(storedRole) as { role?: string };
      preferCandidate = parsed.role === 'candidate';
    } catch {
      preferCandidate = false;
    }
  }

  try {
    let user: AuthUser | null = null;

    if (preferCandidate) {
      user = (yield call(fetchCandidateMe)) as AuthUser | null;
      if (!user) {
        user = (yield call(fetchStaffMe)) as AuthUser | null;
      }
    } else {
      user = (yield call(fetchStaffMe)) as AuthUser | null;
      if (!user) {
        user = (yield call(fetchCandidateMe)) as AuthUser | null;
      }
    }

    if (user) {
      yield put(authActions.getMeSuccess(user));
      return;
    }

    yield put(authActions.getMeFailure('Could not load user profile'));
  } catch (error) {
    if (import.meta.env.DEV && storedRole) {
      try {
        const raw = JSON.parse(storedRole) as ApiUserPayload;
        yield put(authActions.getMeSuccess(mapApiUserToAuthUser(raw)));
        return;
      } catch {
        /* fall through */
      }
    }
    yield put(
      authActions.getMeFailure(
        getErrorMessage(error, 'Session expired. Please sign in again.'),
      ),
    );
    yield put(authActions.clearCredentials());
  }
}

function* bootstrapSaga() {
  yield put(authActions.getMeRequest());
}

function* logoutSaga() {
  const refreshToken = yield select(selectAuthRefreshToken);

  try {
    if (refreshToken) {
      yield call(makeCall, {
        method: 'POST',
        route: API_ROUTES.auth.logout,
        body: { refreshToken },
        isSecureRoute: true,
      });
    }
  } catch {
    /* always clear local session */
  }
  yield put(authActions.logoutSuccess());
}

export function* authSaga() {
  yield takeLatest(authActions.getMeRequest.type, getMeSaga);
  yield takeLatest(authActions.silentGetMeRequest.type, getMeSaga);
  yield takeLatest(authActions.bootstrapRequest.type, bootstrapSaga);
  yield takeLatest(authActions.logoutRequest.type, logoutSaga);
}
