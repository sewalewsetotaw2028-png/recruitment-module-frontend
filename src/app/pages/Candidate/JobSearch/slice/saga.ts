// @ts-nocheck
import { call, put, select, takeLatest } from 'redux-saga/effects';

import makeCall from '@/API';

import { API_ROUTES } from '@/API/apiRoutes';

import { getErrorMessage } from '@/utils/apiMappers';

import { candidateJobSearchActions } from './index';

import { selectAuthUser } from '@/slice/authSlice/selectors';

import { mapApiVacancy } from '../../../Recruitment/Vacancies/api';



function* fetchVacanciesSaga() {

  try {

    const user = yield select(selectAuthUser);

    if (!user) throw new Error('User not logged in.');



    // Use the auth-based endpoint (reads company_id from JWT token) so we don’t

    // depend on organizationId being correctly set in the URL.

    const route = API_ROUTES.candidates.vacanciesAuth

      ?? API_ROUTES.candidates.vacancies(user.organizationId ?? '');



    const { data } = yield call(makeCall<{ status: string; data: unknown }>, {

      method: 'GET',

      route,

      isSecureRoute: true,

    });



    let rows: any[] = [];

    // Handle different response structures from backend

    // Backend returns: { status: 'success', data: { vacancies, total, page, limit, total_pages } }

    if (data?.data) {

      if (Array.isArray(data.data)) {

        rows = data.data;

      } else if (typeof data.data === 'object' && 'vacancies' in data.data && Array.isArray((data.data as any).vacancies)) {

        rows = (data.data as any).vacancies;

      }

    }

    const vacancies = rows.map((row) => mapApiVacancy(row));



    yield put(candidateJobSearchActions.fetchVacanciesSuccess(vacancies));

  } catch (error) {

    yield put(

      candidateJobSearchActions.fetchVacanciesFailure(

        getErrorMessage(error, 'Could not load open vacancies.'),

      ),

    );

  }

}



function* applyToJobSaga(

  action: ReturnType<typeof candidateJobSearchActions.applyToJobRequest>,

) {

  const { vacancyId, coverLetter, expectedSalary, recruitmentSourceId } = action.payload;

  try {

    const isFile = coverLetter != null && typeof coverLetter === 'object' && 'name' in coverLetter && 'size' in coverLetter;
    const body: any = {
      vacancy_id: vacancyId,
      expected_salary: expectedSalary,
      recruitment_source_id: recruitmentSourceId,
    };

    if (isFile) {
      body.cover_letter_file = coverLetter;
    } else if (coverLetter) {
      body.cover_letter = coverLetter;
    }

    yield call(makeCall, {

      method: 'POST',

      route: API_ROUTES.candidates.apply,

      body,

      isSecureRoute: true,

      ...(isFile && { isFormData: true }),

    });



    yield put(candidateJobSearchActions.applyToJobSuccess());

  } catch (error) {

    yield put(

      candidateJobSearchActions.applyToJobFailure(

        getErrorMessage(error, 'Failed to submit application.'),

      ),

    );

  }

}



export function* candidateJobSearchSaga() {

  yield takeLatest(

    candidateJobSearchActions.fetchVacanciesRequest.type,

    fetchVacanciesSaga,

  );

  yield takeLatest(

    candidateJobSearchActions.applyToJobRequest.type,

    applyToJobSaga,

  );

}

