import { useRecruitmentRequestCreateSlice } from './slice';
import { useRecruitmentRequestsSlice } from '@/pages/Recruitment/RecruitmentRequests/slice';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/state';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { recruitmentRequestsActions } from '../RecruitmentRequests/slice';
import {
  selectRecruitmentRequestsActionError,
  selectRecruitmentRequestsActionLoading,
  selectRecruitmentRequestsActionSuccess,
  selectLastCreatedRequestId,
} from '@/pages/Recruitment/RecruitmentRequests/slice/selectors';
import { useToast } from '@/components/common/Toast';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { RecruitmentRequestCreateForm } from './components/RecruitmentRequestCreateForm';
import { API_ROUTES } from '@/API/apiRoutes';
import type { RecruitmentRequestFormPayload } from '@/types';
import { derivePlannedRequestStaffingFields } from '@/utils/recruitmentRequest';
import {
  fetchHiringManagerOptions,
  resolveHiringManagerName,
  fetchRecruitmentRequestById,
  type HiringManagerOption,
} from '@/pages/Recruitment/RecruitmentRequests/api';

const EMPTY: RecruitmentRequestFormPayload = {
  requestTitle: '',
  hiringManagerId: '',
  departmentId: '',
  departmentName: '',
  jobTitle: undefined,
  grade: undefined,
  priority: 'Medium',
  employmentType: undefined,
  numberOfOpenings: undefined,
  location: undefined,
  requestType: 'planned',
  workforcePlanId: '',
  workforcePlanItemId: '',
  isReplacement: false,
  replacementEmployeeId: '',
  replacementReason: '',
  justification: '',
  supportingDocumentName: undefined,
  customFieldValues: {},
};

export const RecruitmentRequestCreatePage: React.FC = () => {
  useRecruitmentRequestCreateSlice();
  useRecruitmentRequestsSlice();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { toast } = useToast();
  const { can } = usePermissions();
  const { workforcePlans, users, currentUser, departments } = useApp();
  const dispatch = useAppDispatch();
  const actionLoading = useAppSelector(
    selectRecruitmentRequestsActionLoading,
  );
  const actionError = useAppSelector(selectRecruitmentRequestsActionError);
  const actionSuccess = useAppSelector(selectRecruitmentRequestsActionSuccess);

  const [form, setForm] = useState<RecruitmentRequestFormPayload>({ ...EMPTY });
  const [docUploaded, setDocUploaded] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [pendingAction, setPendingAction] = useState<'draft' | 'submitted' | 'update' | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  // Holds the selected File until the request ID is known
  const pendingFileRef = useRef<File | null>(null);
  const lastCreatedRequestId = useAppSelector(selectLastCreatedRequestId);
  const [backendHiringManagers, setBackendHiringManagers] = useState<
    HiringManagerOption[]
  >([]);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);

  const hiringManagers = users.filter((u) => u.roleSlug === 'hiring_manager');
  const resolvedHiringManagers =
    backendHiringManagers.length > 0 ? backendHiringManagers : hiringManagers;

  useEffect(() => {
    let cancelled = false;

    fetchHiringManagerOptions()
      .then((rows) => {
        if (!cancelled && rows.length > 0) {
          setBackendHiringManagers(rows);
        }
      })
      .catch(() => {
        // fall back to users from app context
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load existing request data when in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    let cancelled = false;

    const loadRequest = async () => {
      setIsLoadingRequest(true);
      try {
        const request = await fetchRecruitmentRequestById(id);
        if (!cancelled) {
          setForm({
            requestTitle: request.requestTitle || '',
            hiringManagerId: request.hiringManagerId || '',
            departmentId: request.departmentId || '',
            departmentName: request.departmentName || '',
            jobTitle: request.jobTitle,
            grade: request.grade,
            priority: request.priority || 'Medium',
            employmentType: request.employmentType,
            numberOfOpenings: request.numberOfOpenings,
            location: request.location,
            requestType: request.requestType || 'planned',
            workforcePlanId: request.workforcePlanId || '',
            workforcePlanItemId: request.workforcePlanItemId || '',
            isReplacement: request.isReplacement || false,
            replacementEmployeeId: request.replacementEmployeeId || '',
            replacementReason: request.replacementReason || '',
            justification: request.justification || '',
            supportingDocumentName: request.supportingDocumentName,
            customFieldValues: request.customFieldValues || {},
          });
          setDocUploaded(!!request.supportingDocumentName);
          setCreatedRequestId(id);
        }
      } catch (error) {
        if (!cancelled) {
          toast('Failed to load request data', 'error');
          navigate('/dashboard/recruitment-requests');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRequest(false);
        }
      }
    };

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, id, navigate, toast]);

  useEffect(() => {
    const defaultDept = departments[0] || { id: '', name: '' };
    setForm((current) => ({
      ...current,
      hiringManagerId: current.hiringManagerId || currentUser.id,
      departmentId: current.departmentId || defaultDept.id,
      departmentName: current.departmentName || defaultDept.name,
    }));
  }, [currentUser.id, departments]);

  useEffect(() => {
    if (!pendingAction || actionLoading) return;

    if (actionError) {
      toast(actionError, 'error');
      dispatch(recruitmentRequestsActions.clearActionState());
      setPendingAction(null);
      return;
    }

    if (!actionSuccess) {
      return;
    }

    let cancelled = false;

    const finish = (status: 'saved' | 'uploaded' | 'upload_failed') => {
      if (cancelled) return;

      if (status === 'upload_failed') {
        toast(
          isEditMode
            ? 'Request updated, but the supporting document failed to upload. Open the request to re-attach it.'
            : 'Request created, but the supporting document failed to upload. Open the request to re-attach it.',
          'error',
        );
      } else {
        toast(
          pendingAction === 'draft' || pendingAction === 'update'
            ? status === 'uploaded'
              ? isEditMode
                ? 'Draft requisition updated and supporting document uploaded.'
                : 'Draft requisition saved and supporting document uploaded.'
              : isEditMode
                ? 'Draft requisition updated.'
                : 'Draft requisition saved.'
            : status === 'uploaded'
              ? isEditMode
                ? 'Requisition updated and supporting document uploaded.'
                : 'Requisition submitted and supporting document uploaded.'
              : isEditMode
                ? 'Requisition updated for HR review.'
                : 'Requisition submitted for HR review.',
          'success',
        );
      }

      setPendingAction(null);
      dispatch(recruitmentRequestsActions.clearActionState());
      navigate('/dashboard/recruitment-requests');
    };

    const uploadPendingDocument = async () => {
      const file = pendingFileRef.current;
      if (!file) {
        finish('saved');
        return;
      }

      const requestId = isEditMode ? id : lastCreatedRequestId;
      if (!requestId) return;

      if (!cancelled) {
        setCreatedRequestId(requestId);
      }
      pendingFileRef.current = null;
      setIsUploadingDocument(true);

      try {
        const base =
          (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token') || '';
        const fd = new FormData();
        fd.append('document', file);

        const response = await fetch(
          `${base}${API_ROUTES.recruitment.uploadDocument(requestId)}`,
          {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          },
        );
        const json = await response.json();

        if (!response.ok || json?.status !== 'success') {
          throw new Error('Supporting document upload failed');
        }

        if (!cancelled) {
          setForm((current) => ({
            ...current,
            supportingDocumentName: file.name,
          }));
          setDocUploaded(true);
          dispatch(recruitmentRequestsActions.fetchRequestsRequest());
        }

        finish('uploaded');
      } catch {
        finish('upload_failed');
      } finally {
        if (!cancelled) {
          setIsUploadingDocument(false);
        }
      }
    };

    void uploadPendingDocument();

    return () => {
      cancelled = true;
    };
  }, [
    actionError,
    actionLoading,
    actionSuccess,
    dispatch,
    lastCreatedRequestId,
    navigate,
    pendingAction,
    toast,
    isEditMode,
    id,
  ]);

  const selectedWorkforcePlan = workforcePlans.find(
    (w) => w.id === form.workforcePlanId,
  );
  const selectedPlanItem = selectedWorkforcePlan?.items.find(
    (item) => item.id === form.workforcePlanItemId,
  );

  useEffect(() => {
    if (selectedPlanItem && selectedWorkforcePlan) {
      const staffing = derivePlannedRequestStaffingFields(selectedWorkforcePlan);

      setForm((prev) => ({
        ...prev,
        requestTitle:
          prev.requestTitle ||
          `Recruitment request for ${selectedPlanItem.departmentName}`,
        departmentId: selectedPlanItem.departmentId || prev.departmentId,
        departmentName: selectedPlanItem.departmentName || prev.departmentName,
        priority: prev.priority || 'Medium',
        jobTitle: prev.jobTitle || selectedPlanItem.jobTitle,
        numberOfOpenings:
          prev.numberOfOpenings || selectedPlanItem.headcountRequired,
        employmentType: prev.employmentType || selectedPlanItem.employmentType,
        location: staffing.location || prev.location,
        hiringManagerId: staffing.hiringManagerId || prev.hiringManagerId,
      }));
    }
  }, [selectedPlanItem, selectedWorkforcePlan]);

  const setField = <K extends keyof RecruitmentRequestFormPayload>(
    key: K,
    value: RecruitmentRequestFormPayload[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const setCustomFieldValue = (fieldId: string, value: string) => {
    setForm((current) => ({
      ...current,
      customFieldValues: {
        ...(current.customFieldValues || {}),
        [fieldId]: value,
      },
    }));
  };

  const buildPayload = (): RecruitmentRequestFormPayload => {
    const base = {
      ...form,
      supportingDocumentName: docUploaded ? form.supportingDocumentName : undefined,
    };
    // Resolve hiring manager name so it round-trips to the DB
    if (base.hiringManagerId && !(base as any).hiringManagerName) {
      if (base.requestType === 'planned' && selectedWorkforcePlan?.createdByName) {
        (base as any).hiringManagerName =
          selectedWorkforcePlan.createdByName.trim();
      } else {
        const resolvedName = resolveHiringManagerName(
          base.hiringManagerId,
          resolvedHiringManagers,
        );
        if (resolvedName) {
          (base as any).hiringManagerName = resolvedName;
        }
      }
    }

    if (base.requestType === 'planned' && selectedWorkforcePlan) {
      const staffing = derivePlannedRequestStaffingFields(selectedWorkforcePlan);
      if (staffing.location) {
        base.location = staffing.location;
      }
      if (staffing.hiringManagerId) {
        base.hiringManagerId = staffing.hiringManagerId;
      }
      if (staffing.hiringManagerName) {
        (base as any).hiringManagerName = staffing.hiringManagerName;
      }
    }
    return base;
  };

  const handleSaveDraft = () => {
    if (isEditMode && id) {
      dispatch(
        recruitmentRequestsActions.updateRequestRequest({
          requestId: id,
          data: buildPayload(),
        }),
      );
      setPendingAction('update');
    } else {
      dispatch(
        recruitmentRequestsActions.createRequestRequest({
          data: buildPayload(),
          status: 'draft',
        }),
      );
      setPendingAction('draft');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && id) {
      dispatch(
        recruitmentRequestsActions.updateRequestRequest({
          requestId: id,
          data: buildPayload(),
        }),
      );
      setPendingAction('update');
    } else {
      dispatch(
        recruitmentRequestsActions.createRequestRequest({
          data: buildPayload(),
          status: 'submitted',
        }),
      );
      setPendingAction('submitted');
    }
  };

  if (!can(PERMISSIONS.RECRUITMENT_REQUEST_CREATE) && !isEditMode) {
    return <Navigate to="/dashboard/recruitment-requests" replace />;
  }

  if (isEditMode && !can(PERMISSIONS.RECRUITMENT_REQUEST_UPDATE)) {
    return <Navigate to="/dashboard/recruitment-requests" replace />;
  }

  if (isLoadingRequest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          Loading request data…
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl mx-auto p-lg space-y-lg text-xs animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? 'Edit Recruitment Request' : 'New Recruitment Request'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditMode
              ? 'Update the recruitment request details below.'
              : 'Fill in the details to create a new recruitment request.'}
          </p>
        </div>
      </div>

      <RecruitmentRequestCreateForm
        form={form}
        setField={setField}
        docUploaded={docUploaded}
        setDocUploaded={setDocUploaded}
        editingId={createdRequestId || id}
        hiringManagers={resolvedHiringManagers}
        departments={departments}
        workforcePlans={workforcePlans.filter((w) => w.status === 'approved')}
        selectedWorkforcePlan={selectedWorkforcePlan}
        users={users}
        customFieldValues={form.customFieldValues || {}}
        setCustomFieldValue={setCustomFieldValue}
        onFileSelected={(file) => {
          pendingFileRef.current = file;
        }}
        isSaving={actionLoading || isUploadingDocument}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard/recruitment-requests')}
        isEditMode={isEditMode}
      />
    </div>
  );
};

export default RecruitmentRequestCreatePage;
