import { call, put, takeLatest } from 'redux-saga/effects';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { getErrorMessage } from '@/utils/apiMappers';
import { candidateProfileActions } from './index';
import type {
  CandidateProfileData,
  Education,
  Experience,
  CandidateProfileDocument,
  Certification,
  CandidatePhone,
  CandidateAddress,
} from '../../types';

type ApiRaw = Record<string, unknown>;

const getString = (obj: ApiRaw, ...keys: string[]): string => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return '';
};

const getOptionalString = (
  obj: ApiRaw,
  ...keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
};

const getNumber = (obj: ApiRaw, ...keys: string[]): number => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
};

const normalizeExperience = (exp: ApiRaw): Experience => ({
  id: getString(exp, 'id'),
  companyName: getString(exp, 'company_name', 'companyName'),
  position: getString(exp, 'position', 'job_title'),
  startDate: getString(exp, 'start_date', 'startDate'),
  endDate: getOptionalString(exp, 'end_date', 'endDate'),
  description: getOptionalString(exp, 'description'),
  documentUrl: getOptionalString(exp, 'document_url', 'documentUrl'),
});

const normalizeEducation = (edu: ApiRaw): Education => ({
  id: getString(edu, 'id'),
  institution: getString(edu, 'institution_name', 'institution'),
  degree: getString(edu, 'degree'),
  fieldOfStudy: getString(edu, 'field_of_study', 'fieldOfStudy'),
  graduationYear: getNumber(edu, 'graduation_year', 'graduationYear'),
  certificateUrl: getOptionalString(edu, 'certificate_url', 'certificateUrl'),
});

const normalizeDocument = (doc: ApiRaw): CandidateProfileDocument => ({
  id: getString(doc, 'id'),
  name: getString(doc, 'name'),
  fileUrl: getString(doc, 'file_url', 'fileUrl'),
  documentType: getString(doc, 'document_type', 'documentType'),
});

const createDocumentFromUpload = (
  uploadedUrl: string,
  documentType?: string,
): CandidateProfileDocument => {
  const fileName = uploadedUrl.split('/').pop() || uploadedUrl;
  const label =
    documentType === 'cv'
      ? 'CV / Resume'
      : documentType === 'photo'
        ? 'Profile Photo'
        : documentType === 'id_documents'
          ? 'ID Document'
          : 'Document';

  return {
    id: uploadedUrl,
    name: `${label} (${fileName})`,
    fileUrl: uploadedUrl,
    documentType: documentType || 'cv',
  };
};

const normalizeCertification = (cert: ApiRaw): Certification => ({
  id: getString(cert, 'id'),
  name: getString(cert, 'name'),
  issuing_organization: getOptionalString(cert, 'issuing_organization'),
  issue_date: getOptionalString(cert, 'issue_date'),
  expiration_date: getOptionalString(cert, 'expiration_date'),
  credential_id: getOptionalString(cert, 'credential_id'),
  credential_url: getOptionalString(cert, 'credential_url'),
});

const normalizePhone = (phone: ApiRaw): CandidatePhone => ({
  id: getString(phone, 'id'),
  phone_number: getString(phone, 'phone_number'),
  phone_type: getOptionalString(phone, 'phone_type'),
  is_primary: !!phone.is_primary,
});

const normalizeAddress = (addr: ApiRaw): CandidateAddress => ({
  id: getString(addr, 'id'),
  region: getOptionalString(addr, 'region'),
  city: getOptionalString(addr, 'city'),
  sub_city: getOptionalString(addr, 'sub_city'),
  woreda: getOptionalString(addr, 'woreda'),
});

const normalizeCandidateProfile = (payload: ApiRaw): CandidateProfileData => {
  const docObj = payload.candidate_document as ApiRaw | undefined;
  const documents: CandidateProfileDocument[] = [];
  let primaryPhotoUrl: string | undefined;
  console.log('[normalizeCandidateProfile] docObj:', docObj);
  if (docObj) {
    const cvUrls = Array.isArray(docObj.cv) ? docObj.cv : [];
    cvUrls.forEach((url) => {
      documents.push({
        id: url,
        name: `CV / Resume (${url.split('/').pop()})`,
        fileUrl: url,
        documentType: 'cv',
      });
    });

    const photoUrls = Array.isArray(docObj.photo) ? docObj.photo : [];
    console.log('[normalizeCandidateProfile] photoUrls:', photoUrls);
    primaryPhotoUrl = photoUrls[0];
    console.log(
      '[normalizeCandidateProfile] primaryPhotoUrl:',
      primaryPhotoUrl,
    );
    photoUrls.forEach((url) => {
      documents.push({
        id: url,
        name: `Photo (${url.split('/').pop()})`,
        fileUrl: url,
        documentType: 'photo',
      });
    });

    const idDocumentUrls = Array.isArray(docObj.id_documents)
      ? docObj.id_documents
      : [];
    idDocumentUrls.forEach((url) => {
      documents.push({
        id: url,
        name: `ID Document (${url.split('/').pop()})`,
        fileUrl: url,
        documentType: 'id_documents',
      });
    });
  }

  const primaryAddress =
    Array.isArray(payload.addresses) && payload.addresses.length > 0
      ? (payload.addresses[0] as ApiRaw)
      : undefined;
  const derivedCurrentAddress = [
    getOptionalString(payload, 'current_address'),
    [
      getOptionalString(primaryAddress ?? {}, 'city'),
      getOptionalString(primaryAddress ?? {}, 'region'),
    ]
      .filter(Boolean)
      .join(', '),
  ].find((value) => Boolean(value));

  return {
    id: getString(payload, 'id'),
    firstName: getString(payload, 'first_name', 'firstName'),
    lastName: getString(payload, 'last_name', 'lastName'),
    email: getString(payload, 'email'),
    phone: getOptionalString(payload, 'phone'),
    photo: primaryPhotoUrl,
    gender: getOptionalString(payload, 'gender'),
    date_of_birth: getOptionalString(payload, 'date_of_birth'),
    nationality: getOptionalString(payload, 'nationality'),
    current_address: derivedCurrentAddress,
    location: derivedCurrentAddress || getOptionalString(payload, 'location'),
    years_of_experience:
      getOptionalString(payload, 'years_of_experience') !== undefined
        ? Number(payload.years_of_experience)
        : undefined,
    current_employer: getOptionalString(payload, 'current_employer'),
    current_position: getOptionalString(payload, 'current_position'),
    skills: Array.isArray(payload.skills) ? payload.skills.map(String) : [],
    languages: Array.isArray(payload.languages)
      ? payload.languages.map(String)
      : [],
    portfolio_url: getOptionalString(payload, 'portfolio_url'),
    preferred_job_category: getOptionalString(
      payload,
      'preferred_job_category',
    ),
    preferred_location: getOptionalString(payload, 'preferred_location'),
    expected_salary:
      getOptionalString(payload, 'expected_salary') !== undefined
        ? Number(payload.expected_salary)
        : undefined,
    availability_status: getOptionalString(payload, 'availability_status'),
    remarks: getOptionalString(payload, 'remarks'),
    experiences: Array.isArray(payload.experiences)
      ? payload.experiences.map((item) => normalizeExperience(item as ApiRaw))
      : [],
    educations: Array.isArray(payload.educations)
      ? payload.educations.map((item) => normalizeEducation(item as ApiRaw))
      : [],
    documents,
    certifications: Array.isArray(payload.certifications)
      ? payload.certifications.map((item) =>
          normalizeCertification(item as ApiRaw),
        )
      : [],
    phones: Array.isArray(payload.phones)
      ? payload.phones.map((item) => normalizePhone(item as ApiRaw))
      : [],
    addresses: Array.isArray(payload.addresses)
      ? payload.addresses.map((item) => normalizeAddress(item as ApiRaw))
      : [],
  };
};

function* fetchProfileSaga(): Generator {
  try {
    const { data } = yield call(makeCall<{ status: string; data: ApiRaw }>, {
      method: 'GET',
      route: API_ROUTES.candidates.me,
      isSecureRoute: true,
    });
    const profile = normalizeCandidateProfile(data.data ?? data);
    yield put(candidateProfileActions.fetchProfileSuccess(profile));
  } catch (error) {
    yield put(
      candidateProfileActions.fetchProfileFailure(
        getErrorMessage(error, 'Failed to fetch candidate profile.'),
      ),
    );
  }
}

function* addExperienceSaga(
  action: ReturnType<typeof candidateProfileActions.addExperienceRequest>,
): Generator {
  const { payload, file } = action.payload;
  try {
    const formData = new FormData();
    formData.append('company_name', payload.companyName || '');
    formData.append('job_title', payload.position || '');
    formData.append('start_date', payload.startDate || '');
    if (payload.endDate) {
      formData.append('end_date', payload.endDate);
    }
    if (payload.description) {
      formData.append('description', payload.description);
    }
    if (file) {
      formData.append('document', file);
    }

    const { data } = yield call(makeCall<{ status: string; data: ApiRaw }>, {
      method: 'POST',
      route: API_ROUTES.candidates.experience,
      body: formData,
      isSecureRoute: true,
    });

    yield put(
      candidateProfileActions.addExperienceSuccess(
        normalizeExperience(data.data ?? data),
      ),
    );
  } catch (error) {
    yield put(
      candidateProfileActions.addExperienceFailure(
        getErrorMessage(error, 'Failed to add work experience.'),
      ),
    );
  }
}

function* updateExperienceSaga(
  action: ReturnType<typeof candidateProfileActions.updateExperienceRequest>,
): Generator {
  const { payload: exp, file } = action.payload;
  try {
    const body = file
      ? new FormData()
      : {
          company_name: exp.companyName,
          job_title: exp.position,
          start_date: exp.startDate,
          end_date: exp.endDate,
          description: exp.description,
          document_url: exp.documentUrl,
        };

    if (file) {
      body.append('company_name', exp.companyName || '');
      body.append('job_title', exp.position || '');
      body.append('start_date', exp.startDate || '');
      if (exp.endDate) {
        body.append('end_date', exp.endDate);
      }
      if (exp.description) {
        body.append('description', exp.description);
      }
      if (exp.documentUrl) {
        body.append('document_url', exp.documentUrl);
      }
      body.append('document', file);
    }

    const { data } = yield call(makeCall<{ status: string; data: ApiRaw }>, {
      method: 'PATCH',
      route: API_ROUTES.candidates.experienceById(exp.id),
      body,
      isSecureRoute: true,
    });

    yield put(
      candidateProfileActions.updateExperienceSuccess(
        normalizeExperience(data.data ?? data),
      ),
    );
  } catch (error) {
    yield put(
      candidateProfileActions.updateExperienceFailure(
        getErrorMessage(error, 'Failed to update work experience.'),
      ),
    );
  }
}

function* deleteExperienceSaga(
  action: ReturnType<typeof candidateProfileActions.deleteExperienceRequest>,
): Generator {
  const id = action.payload;
  try {
    yield call(makeCall, {
      method: 'DELETE',
      route: API_ROUTES.candidates.experienceById(id),
      isSecureRoute: true,
    });
    yield put(candidateProfileActions.deleteExperienceSuccess(id));
  } catch (error) {
    yield put(
      candidateProfileActions.deleteExperienceFailure(
        getErrorMessage(error, 'Failed to delete work experience.'),
      ),
    );
  }
}

function* addEducationSaga(
  action: ReturnType<typeof candidateProfileActions.addEducationRequest>,
): Generator {
  const { education, file } = action.payload as {
    education: Education;
    file: File | null;
  };
  try {
    const formData = new FormData();
    formData.append('institution_name', education.institution || '');
    formData.append('degree', education.degree || '');
    formData.append('field_of_study', education.fieldOfStudy || '');
    formData.append('graduation_year', String(education.graduationYear || ''));
    if (file) {
      formData.append('certificate', file);
    }

    const { data } = yield call(makeCall<{ status: string; data: ApiRaw }>, {
      method: 'POST',
      route: API_ROUTES.candidates.education,
      body: formData,
      isSecureRoute: true,
    });

    yield put(
      candidateProfileActions.addEducationSuccess(
        normalizeEducation(data.data ?? data),
      ),
    );
  } catch (error) {
    yield put(
      candidateProfileActions.addEducationFailure(
        getErrorMessage(error, 'Failed to add education.'),
      ),
    );
  }
}

function* updateEducationSaga(
  action: ReturnType<typeof candidateProfileActions.updateEducationRequest>,
): Generator {
  const { payload: edu, file } = action.payload as {
    payload: Education;
    file?: File | null;
  };
  try {
    const body = file
      ? new FormData()
      : {
          institution_name: edu.institution,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy,
          graduation_year: edu.graduationYear,
          certificate_url: edu.certificateUrl,
        };

    if (file) {
      body.append('institution_name', edu.institution || '');
      body.append('degree', edu.degree || '');
      body.append('field_of_study', edu.fieldOfStudy || '');
      if (edu.graduationYear !== undefined) {
        body.append('graduation_year', String(edu.graduationYear));
      }
      if (edu.certificateUrl) {
        body.append('certificate_url', edu.certificateUrl);
      }
      body.append('certificate', file);
    }

    const { data } = yield call(makeCall<{ status: string; data: ApiRaw }>, {
      method: 'PATCH',
      route: API_ROUTES.candidates.educationById(edu.id),
      body,
      isSecureRoute: true,
    });

    yield put(
      candidateProfileActions.updateEducationSuccess(
        normalizeEducation(data.data ?? data),
      ),
    );
  } catch (error) {
    yield put(
      candidateProfileActions.updateEducationFailure(
        getErrorMessage(error, 'Failed to update education.'),
      ),
    );
  }
}

function* deleteEducationSaga(
  action: ReturnType<typeof candidateProfileActions.deleteEducationRequest>,
): Generator {
  const id = action.payload;
  try {
    yield call(makeCall, {
      method: 'DELETE',
      route: API_ROUTES.candidates.educationById(id),
      isSecureRoute: true,
    });
    yield put(candidateProfileActions.deleteEducationSuccess(id));
  } catch (error) {
    yield put(
      candidateProfileActions.deleteEducationFailure(
        getErrorMessage(error, 'Failed to delete education.'),
      ),
    );
  }
}

function* uploadDocumentSaga(
  action: ReturnType<typeof candidateProfileActions.uploadDocumentRequest>,
): Generator {
  const formData = action.payload;
  try {
    const response = (yield call(makeCall<{ data: any }>, {
      method: 'POST',
      route: API_ROUTES.candidates.documents,
      body: formData,
      isSecureRoute: true,
    })) as { data: any };
    const result = response.data ?? response;
    const uploadPayload = result?.data ?? result;
    const uploadedUrl =
      uploadPayload?.uploaded_url ||
      uploadPayload?.fileUrl ||
      uploadPayload?.url ||
      '';
    if (!uploadedUrl)
      throw new Error('Upload response did not include a file URL.');
    yield put(
      candidateProfileActions.uploadDocumentSuccess(
        createDocumentFromUpload(uploadedUrl, uploadPayload?.document_type),
      ),
    );
    // Refetch profile to get updated documents from backend
    yield put(candidateProfileActions.fetchProfileRequest());
  } catch (error) {
    yield put(
      candidateProfileActions.uploadDocumentFailure(
        getErrorMessage(error, 'Failed to upload document.'),
      ),
    );
  }
}

function* uploadAvatarSaga(
  action: ReturnType<typeof candidateProfileActions.uploadAvatarRequest>,
): Generator {
  const formData = action.payload;
  try {
    const response = (yield call(makeCall<{ data: any }>, {
      method: 'POST',
      route: API_ROUTES.candidates.avatar,
      body: formData,
      isSecureRoute: true,
    })) as { data: any };
    const result = response.data ?? response;
    const uploadPayload = result?.data ?? result;
    const photoUrl = uploadPayload?.photo_url || uploadPayload?.photoUrl || '';
    if (!photoUrl)
      throw new Error('Upload response did not include a photo URL.');

    yield put(candidateProfileActions.uploadAvatarSuccess(photoUrl));
    yield put(candidateProfileActions.fetchProfileRequest());
  } catch (error) {
    yield put(
      candidateProfileActions.uploadAvatarFailure(
        getErrorMessage(error, 'Failed to upload profile photo.'),
      ),
    );
  }
}

function* removeAvatarSaga(): Generator {
  try {
    yield call(makeCall, {
      method: 'DELETE',
      route: API_ROUTES.candidates.avatar,
      isSecureRoute: true,
    });
    yield put(candidateProfileActions.removeAvatarSuccess());
    yield put(candidateProfileActions.fetchProfileRequest());
  } catch (error) {
    yield put(
      candidateProfileActions.removeAvatarFailure(
        getErrorMessage(error, 'Failed to remove profile photo.'),
      ),
    );
  }
}

function* deleteDocumentSaga(
  action: ReturnType<typeof candidateProfileActions.deleteDocumentRequest>,
): Generator {
  const id = action.payload as string;
  try {
    yield call(makeCall, {
      method: 'DELETE',
      route: API_ROUTES.candidates.document(id),
      isSecureRoute: true,
    });
    yield put(candidateProfileActions.deleteDocumentSuccess(id));
  } catch (error) {
    yield put(
      candidateProfileActions.deleteDocumentFailure(
        getErrorMessage(error, 'Failed to delete document.'),
      ),
    );
  }
}

export function* candidateProfileSaga() {
  yield takeLatest(
    candidateProfileActions.fetchProfileRequest.type,
    fetchProfileSaga,
  );
  yield takeLatest(
    candidateProfileActions.addExperienceRequest.type,
    addExperienceSaga,
  );
  yield takeLatest(
    candidateProfileActions.updateExperienceRequest.type,
    updateExperienceSaga,
  );
  yield takeLatest(
    candidateProfileActions.deleteExperienceRequest.type,
    deleteExperienceSaga,
  );
  yield takeLatest(
    candidateProfileActions.addEducationRequest.type,
    addEducationSaga,
  );
  yield takeLatest(
    candidateProfileActions.updateEducationRequest.type,
    updateEducationSaga,
  );
  yield takeLatest(
    candidateProfileActions.deleteEducationRequest.type,
    deleteEducationSaga,
  );
  yield takeLatest(
    candidateProfileActions.uploadDocumentRequest.type,
    uploadDocumentSaga,
  );
  yield takeLatest(
    candidateProfileActions.uploadAvatarRequest.type,
    uploadAvatarSaga,
  );
  yield takeLatest(
    candidateProfileActions.deleteDocumentRequest.type,
    deleteDocumentSaga,
  );
  yield takeLatest(
    candidateProfileActions.removeAvatarRequest.type,
    removeAvatarSaga,
  );
}
