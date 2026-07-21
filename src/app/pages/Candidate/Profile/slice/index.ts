import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { candidateProfileSaga } from './saga';
import type { CandidateProfileState } from './types';
import type { ExtractedProfile } from '../utils/cvExtractor';
import type {
  CandidateProfileData,
  Education,
  Experience,
  CandidateProfileDocument,
} from '../../types';

export const initialState: CandidateProfileState = {
  loading: false,
  error: null,
  profile: null,
  actionSuccess: null,
  actionError: null,
};

const slice = createSlice({
  name: 'candidateProfile',
  initialState,
  reducers: {
    fetchProfileRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess(state, action: PayloadAction<CandidateProfileData>) {
      state.loading = false;
      state.profile = action.payload;
    },
    fetchProfileFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    addExperienceRequest(
      state,
      _action: PayloadAction<{
        payload: Partial<Experience>;
        file: File | null;
      }>,
    ) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    addExperienceSuccess(state, action: PayloadAction<Experience>) {
      state.loading = false;
      if (state.profile) {
        state.profile.experiences = [
          ...state.profile.experiences,
          action.payload,
        ];
      }
      state.actionSuccess = 'Experience added successfully';
    },
    addExperienceFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    updateExperienceRequest(
      state,
      _action: PayloadAction<{ payload: Experience; file?: File | null }>,
    ) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    updateExperienceSuccess(state, action: PayloadAction<Experience>) {
      state.loading = false;
      if (state.profile) {
        state.profile.experiences = state.profile.experiences.map((exp) =>
          exp.id === action.payload.id ? action.payload : exp,
        );
      }
      state.actionSuccess = 'Experience updated successfully';
    },
    updateExperienceFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    deleteExperienceRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    deleteExperienceSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      if (state.profile) {
        state.profile.experiences = state.profile.experiences.filter(
          (exp) => exp.id !== action.payload,
        );
      }
      state.actionSuccess = 'Experience deleted successfully';
    },
    deleteExperienceFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    addEducationRequest(
      state,
      _action: PayloadAction<{
        payload: Partial<Education>;
        file: File | null;
      }>,
    ) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    addEducationSuccess(state, action: PayloadAction<Education>) {
      state.loading = false;
      if (state.profile) {
        state.profile.educations = [
          ...state.profile.educations,
          action.payload,
        ];
      }
      state.actionSuccess = 'Education added successfully';
    },
    addEducationFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    updateEducationRequest(
      state,
      _action: PayloadAction<{ payload: Education; file?: File | null }>,
    ) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    updateEducationSuccess(state, action: PayloadAction<Education>) {
      state.loading = false;
      if (state.profile) {
        state.profile.educations = state.profile.educations.map((edu) =>
          edu.id === action.payload.id ? action.payload : edu,
        );
      }
      state.actionSuccess = 'Education updated successfully';
    },
    updateEducationFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    deleteEducationRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    deleteEducationSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      if (state.profile) {
        state.profile.educations = state.profile.educations.filter(
          (edu) => edu.id !== action.payload,
        );
      }
      state.actionSuccess = 'Education deleted successfully';
    },
    deleteEducationFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    uploadDocumentRequest(state, _action: PayloadAction<FormData>) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    // Auto-fill profile from extracted CV data — updates fields that are empty/default only
    autoFillFromCv(state, action: PayloadAction<ExtractedProfile>) {
      if (!state.profile) return;
      const p = action.payload;
      // Personal details — only fill if field is currently empty
      if (p.firstName && !state.profile.firstName) state.profile.firstName = p.firstName;
      if (p.lastName && !state.profile.lastName) state.profile.lastName = p.lastName;
      if (p.email && !state.profile.email) state.profile.email = p.email;
      if (p.gender && !state.profile.gender) state.profile.gender = p.gender;
      if (p.dateOfBirth && !state.profile.date_of_birth) state.profile.date_of_birth = p.dateOfBirth;
      if (p.nationality && !state.profile.nationality) state.profile.nationality = p.nationality;
      if (p.currentAddress && !state.profile.current_address) state.profile.current_address = p.currentAddress;
      if (p.currentEmployer && !state.profile.current_employer) state.profile.current_employer = p.currentEmployer;
      if (p.currentPosition && !state.profile.current_position) state.profile.current_position = p.currentPosition;
      if (p.yearsOfExperience && !state.profile.years_of_experience) state.profile.years_of_experience = p.yearsOfExperience;
      if (p.expectedSalary && !state.profile.expected_salary) state.profile.expected_salary = p.expectedSalary;
      if (p.preferredLocation && !state.profile.preferred_location) state.profile.preferred_location = p.preferredLocation;
      if (p.preferredJobCategory && !state.profile.preferred_job_category) state.profile.preferred_job_category = p.preferredJobCategory;
      if (p.availabilityStatus && !state.profile.availability_status) state.profile.availability_status = p.availabilityStatus;
      if (p.summary && !state.profile.remarks) state.profile.remarks = p.summary;
      if (p.portfolioUrl && !state.profile.portfolio_url) state.profile.portfolio_url = p.portfolioUrl;
      // Skills — merge without duplicates
      if (p.skills?.length) {
        const existing = new Set((state.profile.skills || []).map((s: string) => s.toLowerCase()));
        const newSkills = p.skills.filter((s) => !existing.has(s.toLowerCase()));
        state.profile.skills = [...(state.profile.skills || []), ...newSkills];
      }
      // Languages — merge without duplicates
      if (p.languages?.length) {
        const existing = new Set((state.profile.languages || []).map((l: string) => l.toLowerCase()));
        const newLangs = p.languages.filter((l) => !existing.has(l.toLowerCase()));
        state.profile.languages = [...(state.profile.languages || []), ...newLangs];
      }
      // Experience — only prefill if currently empty
      if (p.experiences?.length && !state.profile.experiences?.length) {
        state.profile.experiences = p.experiences.map((e, i) => ({
          id: `cv-extract-${i}`,
          companyName: e.companyName,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description,
        }));
      }
      // Education — only prefill if currently empty
      if (p.educations?.length && !state.profile.educations?.length) {
        state.profile.educations = p.educations.map((e, i) => ({
          id: `cv-edu-${i}`,
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          graduationYear: e.graduationYear || 0,
        }));
      }
      // Certifications — only prefill if currently empty
      if (p.certifications?.length && !state.profile.certifications?.length) {
        state.profile.certifications = p.certifications.map((c, i) => ({
          id: `cv-cert-${i}`,
          name: c.name,
          issuing_organization: c.issuingOrganization,
        }));
      }
      // Don't set actionSuccess here — the parent toasts directly after applying
    },
    uploadAvatarRequest(state, _action: PayloadAction<FormData>) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    removeAvatarRequest(state) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    removeAvatarSuccess(state) {
      state.loading = false;
      if (state.profile) {
        state.profile.photo = undefined;
      }
      state.actionSuccess = 'Profile photo removed successfully';
    },
    removeAvatarFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },
    uploadDocumentSuccess(
      state,
      action: PayloadAction<CandidateProfileDocument>,
    ) {
      state.loading = false;
      state.actionSuccess = 'Document uploaded successfully';
      // Don't add to local state - will refetch from backend to ensure consistency
    },
    uploadAvatarSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      if (state.profile) {
        state.profile.photo = action.payload;
      }
      state.actionSuccess = 'Profile photo updated successfully';
    },
    uploadDocumentFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },
    uploadAvatarFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    deleteDocumentRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.actionError = null;
      state.actionSuccess = null;
    },
    deleteDocumentSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      if (state.profile) {
        state.profile.documents = state.profile.documents.filter(
          (doc) => doc.id !== action.payload,
        );
      }
      state.actionSuccess = 'Document deleted successfully';
    },
    deleteDocumentFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.actionError = action.payload;
    },

    clearActions(state) {
      state.actionSuccess = null;
      state.actionError = null;
    },

    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const candidateProfileActions = slice.actions;

export const useCandidateProfileSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: candidateProfileSaga });
  return { actions: slice.actions };
};

export default slice.reducer;
