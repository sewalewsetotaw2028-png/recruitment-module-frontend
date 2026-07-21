import { useCandidateProfileSlice } from './slice';
import { candidateProfileActions } from './slice';
import {
  selectCandidateProfile,
  selectCandidateProfileLoading,
  selectCandidateProfileError,
  selectCandidateProfileActionSuccess,
  selectCandidateProfileActionError,
} from './slice/selectors';
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useSession } from '@/hooks/useSession';
import { useApp } from '@/state';
import { useToast } from '@/components/common/Toast';
import type {
  CandidateProfileTab,
  Education,
  Experience,
} from '@/pages/Candidate/types';
import { CandidateProfileHeader } from './components/CandidateProfileHeader';
import { CandidateProfileOverviewTab } from './components/CandidateProfileOverviewTab';
import { CandidateProfilePersonalDetailsTab } from './components/CandidateProfilePersonalDetailsTab';
import { CandidateProfileExperienceTab } from './components/CandidateProfileExperienceTab';
import { CandidateProfileEducationTab } from './components/CandidateProfileEducationTab';
import { CandidateProfileDocumentsTab } from './components/CandidateProfileDocumentsTab';
import { CandidateProfileCertificationsTab } from './components/CandidateProfileCertificationsTab';
import { CandidateProfileSkillsLanguagesTab } from './components/CandidateProfileSkillsLanguagesTab';
import { PROFILE_THEME } from './components/profileTheme';
import Modal from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';

type PendingDeleteAction =
  | { type: 'experience'; id: string }
  | { type: 'education'; id: string }
  | { type: 'document'; id: string }
  | null;

export const CandidateProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  useCandidateProfileSlice();
  const { role } = useSession();
  const { currentUser } = useApp();
  const { toast, dismiss } = useToast();
  const [savingToastId, setSavingToastId] = useState<string | null>(null);
  const isCandidateAccount = role === 'candidate' || role === 'applicant';

  const profile = useAppSelector(selectCandidateProfile);
  const loading = useAppSelector(selectCandidateProfileLoading);
  const error = useAppSelector(selectCandidateProfileError);
  const actionSuccess = useAppSelector(selectCandidateProfileActionSuccess);
  const actionError = useAppSelector(selectCandidateProfileActionError);

  // Hold extracted CV data until after the profile refetch completes, then apply it
  const pendingCvExtract = React.useRef<import('./utils/cvExtractor').ExtractedProfile | null>(null);

  const [activeTab, setActiveTab] = useState<CandidateProfileTab>('overview');

  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null,
  );
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null,
  );
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({});
  const [newEducation, setNewEducation] = useState<Partial<Education>>({});
  const [experienceFile, setExperienceFile] = useState<File | null>(null);
  const [educationFile, setEducationFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteAction>(null);

  const stableDispatch = useAppDispatch();

  // Track previous loading value to detect fetch completion
  const prevLoadingRef = React.useRef(loading);
  useEffect(() => {
    // When loading just finished (true → false) and we have pending CV extract data,
    // apply it now — AFTER the profile has been refreshed from backend
    if (prevLoadingRef.current === true && loading === false && pendingCvExtract.current) {
      const data = pendingCvExtract.current;
      pendingCvExtract.current = null;
      stableDispatch(candidateProfileActions.autoFillFromCv(data));
      // Show toast directly — don't rely on actionSuccess which gets cleared by upload handler
      toast('Profile auto-filled from CV. Review each section and save to persist changes.', 'success');
    }
    prevLoadingRef.current = loading;
  }, [loading, stableDispatch]);

  useEffect(() => {
    if (isCandidateAccount) {
      stableDispatch(candidateProfileActions.fetchProfileRequest());
    }
  }, [isCandidateAccount, stableDispatch]);

  useEffect(() => {
    if (actionSuccess) {
      if (savingToastId) {
        dismiss(savingToastId);
        setSavingToastId(null);
      }
      toast(actionSuccess, 'success');
      stableDispatch(candidateProfileActions.clearActions());
      setEditingExperience(null);
      setEditingEducation(null);
      setNewExperience({});
      setNewEducation({});
      setExperienceFile(null);
      setEducationFile(null);
    }
    if (actionError) {
      if (savingToastId) {
        dismiss(savingToastId);
        setSavingToastId(null);
      }
      toast(actionError, 'error');
      stableDispatch(candidateProfileActions.clearActions());
    }
  }, [
    actionSuccess,
    actionError,
    toast,
    dismiss,
    stableDispatch,
    savingToastId,
  ]);

  const calculateTotalExperience = (experiences: Experience[]): number => {
    let totalMonths = 0;
    experiences.forEach((exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += months;
    });
    return Math.floor(totalMonths / 12);
  };

  const handleAddExperience = (): boolean => {
    if (
      !newExperience.companyName ||
      !newExperience.position ||
      !newExperience.startDate
    ) {
      toast('Please fill in required fields', 'error');
      return false;
    }

    stableDispatch(candidateProfileActions.clearActions());
    if (savingToastId) {
      dismiss(savingToastId);
    }
    const id = toast('Saving experience...', 'info', {
      isLoading: true,
      duration: null,
    });
    setSavingToastId(id);

    dispatch(
      candidateProfileActions.addExperienceRequest({
        payload: newExperience,
        file: experienceFile,
      }),
    );
    return true;
  };

  const handleUpdateExperience = () => {
    if (!editingExperience) return;
    stableDispatch(candidateProfileActions.clearActions());
    if (savingToastId) {
      dismiss(savingToastId);
    }
    const id = toast('Saving experience...', 'info', {
      isLoading: true,
      duration: null,
    });
    setSavingToastId(id);

    dispatch(
      candidateProfileActions.updateExperienceRequest({
        payload: editingExperience,
        file: experienceFile,
      }),
    );
  };

  const handleDeleteExperience = (id: string) => {
    setPendingDelete({ type: 'experience', id });
  };

  const handleAddEducation = (): boolean => {
    if (
      !newEducation.institution ||
      !newEducation.degree ||
      !newEducation.fieldOfStudy ||
      !newEducation.graduationYear
    ) {
      toast('Please fill in all required fields', 'error');
      return false;
    }
    stableDispatch(candidateProfileActions.clearActions());
    if (savingToastId) {
      dismiss(savingToastId);
    }
    const id = toast('Saving education...', 'info', {
      isLoading: true,
      duration: null,
    });
    setSavingToastId(id);

    dispatch(
      candidateProfileActions.addEducationRequest({
        payload: newEducation,
        file: educationFile,
      }),
    );
    return true;
  };

  const handleUpdateEducation = () => {
    if (!editingEducation) return;
    stableDispatch(candidateProfileActions.clearActions());
    if (savingToastId) {
      dismiss(savingToastId);
    }
    const id = toast('Saving education...', 'info', {
      isLoading: true,
      duration: null,
    });
    setSavingToastId(id);

    dispatch(
      candidateProfileActions.updateEducationRequest({
        payload: editingEducation,
        file: educationFile,
      }),
    );
  };

  const handleDeleteEducation = (id: string) => {
    setPendingDelete({ type: 'education', id });
  };

  const handleUploadDocument = (file: File, documentType: string = 'cv') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', file.name);
    formData.append('document_type', documentType);
    dispatch(candidateProfileActions.uploadDocumentRequest(formData));
  };

  const handleUploadAvatar = (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    dispatch(candidateProfileActions.uploadAvatarRequest(formData));
  };

  const handleRemoveAvatar = () => {
    dispatch(candidateProfileActions.removeAvatarRequest());
  };

  const handleDeleteDocument = (id: string) => {
    setPendingDelete({ type: 'document', id });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'experience') {
      dispatch(
        candidateProfileActions.deleteExperienceRequest(pendingDelete.id),
      );
    } else if (pendingDelete.type === 'education') {
      dispatch(
        candidateProfileActions.deleteEducationRequest(pendingDelete.id),
      );
    } else if (pendingDelete.type === 'document') {
      dispatch(candidateProfileActions.deleteDocumentRequest(pendingDelete.id));
    }
    setPendingDelete(null);
  };

  if (!isCandidateAccount) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 overflow-x-hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: PROFILE_THEME.primary }}
          >
            Staff profile
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {currentUser.firstName} {currentUser.lastName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{currentUser.roleName}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Role
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {currentUser.roleName}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Department
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {currentUser.departmentName || 'Not assigned'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Email
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {currentUser.email}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Phone Number
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {currentUser.phone || 'Not set'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          This account uses the staff profile view. Candidate self-service
          sections stay hidden for internal roles.
        </div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 w-full p-8 space-y-4 overflow-x-hidden">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{
            border: `4px solid color-mix(in srgb, ${PROFILE_THEME.primary} 20%, transparent)`,
            borderTopColor: PROFILE_THEME.primary,
          }}
        />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading profile records...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-100 rounded-2xl shadow-xl text-center overflow-x-hidden">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-500 mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Could not load your profile
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          We encountered an issue pulling up your profile data framework.
        </p>
        <button
          onClick={() =>
            dispatch(candidateProfileActions.fetchProfileRequest())
          }
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 !text-white text-sm font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        >
          Try again
        </button>
      </div>
    );
  }

  const totalExperience = calculateTotalExperience(profile.experiences);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 antialiased overflow-x-hidden min-w-0">
      {/* Profile Header Wrapper Component */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 min-w-0">
        <CandidateProfileHeader
          profile={profile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalExperience={totalExperience}
          onUploadAvatar={handleUploadAvatar}
          onRemoveAvatar={handleRemoveAvatar}
          uploading={loading}
        />
      </div>

      {/* Dynamic API Handling Notification Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50/60 border border-rose-100 rounded-xl text-rose-800 text-sm font-medium animate-fadeIn">
          <svg
            className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <span className="font-semibold">Something went wrong: </span>
            {error}
          </div>
        </div>
      )}

      {/* Viewport Dynamic Tab Engine Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 transition-all duration-300 min-w-0">
        {activeTab === 'overview' && (
          <CandidateProfileOverviewTab
            profile={profile}
            totalExperience={totalExperience}
          />
        )}

        {activeTab === 'personal-details' && (
          <CandidateProfilePersonalDetailsTab profile={profile} />
        )}

        {activeTab === 'experience' && (
          <CandidateProfileExperienceTab
            profile={profile}
            editingExperience={editingExperience}
            newExperience={newExperience}
            experienceFile={experienceFile}
            uploading={loading}
            setEditingExperience={setEditingExperience}
            setNewExperience={setNewExperience}
            setExperienceFile={setExperienceFile}
            onAddExperience={handleAddExperience}
            onUpdateExperience={handleUpdateExperience}
            onDeleteExperience={handleDeleteExperience}
          />
        )}

        {activeTab === 'education' && (
          <CandidateProfileEducationTab
            profile={profile}
            editingEducation={editingEducation}
            newEducation={newEducation}
            educationFile={educationFile}
            uploading={loading}
            setEditingEducation={setEditingEducation}
            setNewEducation={setNewEducation}
            setEducationFile={setEducationFile}
            onAddEducation={handleAddEducation}
            onUpdateEducation={handleUpdateEducation}
            onDeleteEducation={handleDeleteEducation}
          />
        )}

        {activeTab === 'certifications' && (
          <CandidateProfileCertificationsTab profile={profile} />
        )}

        {activeTab === 'skills-languages' && (
          <CandidateProfileSkillsLanguagesTab profile={profile} />
        )}

        {activeTab === 'documents' && (
          <CandidateProfileDocumentsTab
            profile={profile}
            onUpload={handleUploadDocument}
            onDelete={handleDeleteDocument}
            uploading={loading}
            onCvExtracted={(data) => {
              // Queue the extracted data — will be applied after the profile refetch completes
              pendingCvExtract.current = data;
            }}
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Confirm Deletion"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {pendingDelete?.type === 'document'
              ? 'This will permanently remove the uploaded document from your profile.'
              : pendingDelete?.type === 'education'
                ? 'This will remove the education entry from your profile.'
                : 'This will remove the experience entry from your profile.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CandidateProfilePage;
