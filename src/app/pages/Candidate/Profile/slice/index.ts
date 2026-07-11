import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { candidateProfileSaga } from './saga';
import type { CandidateProfileState } from './types';
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
