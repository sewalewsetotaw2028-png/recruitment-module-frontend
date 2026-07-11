// @ts-nocheck
import { all, call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { mapApiApplication, mapApiInterview } from '../api';
import { candidateDashboardActions } from './index';
import type { CandidateDashboardOffer } from './types';

type ApiRaw = Record<string, unknown>;

/**
 * Compute profile completeness from the raw profile API data.
 * Mirrors the logic in CandidateProfileOverviewTab.tsx so the dashboard
 * shows the same real completeness percentage as the profile page.
 */
function computeCompletenessFromProfile(data: ApiRaw | null) {
  if (!data) return null;

  const sections = [
    {
      key: 'photo',
      label: 'Profile photo',
      path: '/candidate/profile',
      complete: Boolean(
        (data.candidate_document as ApiRaw | undefined)?.['photo'],
      ),
    },
    {
      key: 'contact',
      label: 'Primary contact',
      path: '/candidate/profile',
      complete: Boolean(
        data.phone || (Array.isArray(data.phones) && data.phones.length > 0),
      ),
    },
    {
      key: 'identity',
      label: 'Identity details',
      path: '/candidate/profile',
      complete: Boolean(data.gender || data.date_of_birth || data.nationality),
    },
    {
      key: 'location',
      label: 'Address',
      path: '/candidate/profile',
      complete: Boolean(
        data.current_address ||
          (Array.isArray(data.addresses) && data.addresses.length > 0),
      ),
    },
    {
      key: 'employment',
      label: 'Employment profile',
      path: '/candidate/profile',
      complete: Boolean(
        data.current_position ||
          data.current_employer ||
          data.years_of_experience,
      ),
    },
    {
      key: 'summary',
      label: 'Professional summary',
      path: '/candidate/profile',
      complete: Boolean(
        typeof data.remarks === 'string' && data.remarks.trim().length > 0,
      ),
    },
    {
      key: 'experience',
      label: 'Work history',
      path: '/candidate/profile?tab=experience',
      complete:
        Array.isArray(data.experiences) && data.experiences.length > 0,
    },
    {
      key: 'education',
      label: 'Education',
      path: '/candidate/profile?tab=education',
      complete: Array.isArray(data.educations) && data.educations.length > 0,
    },
    {
      key: 'skills',
      label: 'Skills',
      path: '/candidate/profile',
      complete: Array.isArray(data.skills) && data.skills.length > 0,
    },
    {
      key: 'languages',
      label: 'Languages',
      path: '/candidate/profile',
      complete: Array.isArray(data.languages) && data.languages.length > 0,
    },
    {
      key: 'documents',
      label: 'Documents',
      path: '/candidate/profile?tab=documents',
      complete: (() => {
        const doc = data.candidate_document as ApiRaw | undefined;
        return Boolean(
          doc &&
            (Array.isArray(doc.cv) ||
              Array.isArray(doc.photo) ||
              Array.isArray(doc.id_documents)),
        );
      })(),
    },
    {
      key: 'certifications',
      label: 'Certifications',
      path: '/candidate/profile',
      complete:
        Array.isArray(data.certifications) && data.certifications.length > 0,
    },
    {
      key: 'preferences',
      label: 'Job preferences',
      path: '/candidate/profile',
      complete: Boolean(
        data.preferred_job_category ||
          data.preferred_location ||
          data.expected_salary ||
          data.availability_status,
      ),
    },
  ];

  const completedCount = sections.filter((s) => s.complete).length;
  const percentage =
    sections.length > 0
      ? Math.round((completedCount / sections.length) * 100)
      : 0;

  return { percentage, sections };
}

function* fetchDashboardSaga(): Generator {
  try {
    const [appsRes, interviewsRes, offersRes, completenessRes] = yield all([
      call(makeCall<{ status: string; data: unknown[] }>, {
        method: 'GET',
        route: API_ROUTES.candidates.applications,
        isSecureRoute: true,
      }),
      call(makeCall<{ status: string; data: unknown[] }>, {
        method: 'GET',
        route: API_ROUTES.candidates.interviews,
        isSecureRoute: true,
      }),
      call(makeCall<{ status: string; data: unknown[] }>, {
        method: 'GET',
        route: API_ROUTES.candidates.offers,
        isSecureRoute: true,
      }),
      call(makeCall<{ status: string; data: unknown }>, {
        method: 'GET',
        route: API_ROUTES.candidates.completeness,
        isSecureRoute: true,
      }),
    ]);

    const appsData = Array.isArray(appsRes?.data)
      ? appsRes.data
      : Array.isArray(appsRes?.data?.data)
        ? appsRes.data.data
        : [];
    const applications = appsData.map((row: Record<string, unknown>) =>
      mapApiApplication(row as Record<string, unknown>),
    );

    const interviewsData = Array.isArray(interviewsRes?.data)
      ? interviewsRes.data
      : Array.isArray(interviewsRes?.data?.data)
        ? interviewsRes.data.data
        : [];
    const interviews = interviewsData.map((row: Record<string, unknown>) =>
      mapApiInterview(row as Record<string, unknown>),
    );

    const offers = (Array.isArray(offersRes?.data)
      ? offersRes.data
      : Array.isArray((offersRes as { data?: { data?: unknown[] } })?.data?.data)
        ? (offersRes as { data?: { data?: unknown[] } }).data!.data!
        : []) as CandidateDashboardOffer[];

    // Use the backend completeness endpoint as the single source of truth.
    // Only fall back to local computation if the API fails.
    let completeness: ReturnType<typeof computeCompletenessFromProfile> = null;
    try {
      // makeCall returns { data: <rawBody> }. The backend returns
      // { status: 'success', data: { percentage, sections, missing } }.
      // So completenessRes?.data?.data gives the actual completeness object.
      const raw =
        (completenessRes as Record<string, unknown> | null)?.data?.data ??
        (completenessRes as Record<string, unknown> | null)?.data ??
        null;
      if (raw) {
        completeness = raw as ReturnType<typeof computeCompletenessFromProfile>;
      }
    } catch {
      // Backend API failed — will try local fallback
    }

    // If API didn't produce a result, compute from profile data
    if (!completeness) {
      try {
        const profileRes: { data?: { data?: ApiRaw } | ApiRaw } | null =
          (yield call(makeCall<{ status: string; data: unknown }>, {
            method: 'GET',
            route: API_ROUTES.candidates.me,
            isSecureRoute: true,
          })) as { data?: { data?: ApiRaw } | ApiRaw } | null;

        const profileData: ApiRaw | null =
          (profileRes?.data as { data?: ApiRaw } | undefined)?.data ??
          (profileRes?.data as ApiRaw | undefined) ??
          null;

        if (profileData) {
          completeness = computeCompletenessFromProfile(profileData);
        }
      } catch {
        // Profile fetch failed too — completeness stays null
      }
    }

    yield put(
      candidateDashboardActions.fetchDashboardSuccess({
        applications,
        interviews,
        offers,
        completeness,
      }),
    );
  } catch (error) {
    yield put(
      candidateDashboardActions.fetchDashboardFailure(
        getErrorMessage(error, 'Could not load your dashboard data.'),
      ),
    );
  }
}

export function* candidateDashboardSaga() {
  yield takeLatest(
    candidateDashboardActions.fetchDashboardRequest.type,
    fetchDashboardSaga,
  );
}
