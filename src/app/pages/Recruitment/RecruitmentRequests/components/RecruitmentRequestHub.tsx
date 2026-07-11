// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/state';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  recruitmentRequestsActions,
  useRecruitmentRequestsSlice,
} from '../slice';
import { selectRecruitmentRequests, selectLastCreatedRequestId } from '../slice/selectors';
import { useToast } from '@/components/common/Toast';
import { apiFetch } from '@/services/apiClient';
import { API_ROUTES } from '@/API/apiRoutes';
import { FrDemoPanel } from '@/components/FrDemoPanel';
import { getFrForScreen } from '@/data/frRegistry';
import { RecruitmentRequestList } from './RecruitmentRequestList';
import { RecruitmentRequestCreateForm } from '@/pages/Recruitment/RecruitmentRequestCreate/components/RecruitmentRequestCreateForm';
import type {
  RecruitmentRequest,
  RecruitmentRequestFormPayload,
  User,
} from '@/types';
import {
  derivePlannedRequestStaffingFields,
  getApprovalSteps,
  payloadFromRequest,
  statusBadge,
  validateRequestPayload,
} from '@/utils/recruitmentRequest';
import {
  resolveHiringManagerName,
} from '../api';
import {
  selectRecruitmentRequestsActionError,
  selectRecruitmentRequestsActionLoading,
} from '../slice/selectors';

type Portal = 'hm' | 'hr' | 'ceo' | 'department_manager';

const getReplacementName = (employeeId: string, users: User[]) => {
  if (!employeeId.trim()) return '';
  const normalized = employeeId.trim().toLowerCase();
  const matched = users.find(
    (u) =>
      u.id.toLowerCase() === normalized ||
      u.email.toLowerCase().includes(normalized) ||
      `${u.firstName.toLowerCase()} ${u.lastName.toLowerCase()}`.includes(
        normalized,
      ),
  );
  return matched
    ? `${matched.firstName} ${matched.lastName}`
    : `Employee ${employeeId}`;
};

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

interface Props {
  portal: Portal;
}

export const RecruitmentRequestHub: React.FC<Props> = ({ portal }) => {
  useRecruitmentRequestsSlice();
  const recruitmentRequests = useAppSelector(selectRecruitmentRequests);
  const lastCreatedRequestId = useAppSelector(selectLastCreatedRequestId);
  const actionLoading = useAppSelector(
    selectRecruitmentRequestsActionLoading,
  );
  const actionError = useAppSelector(selectRecruitmentRequestsActionError);
  const {
    workforcePlans,
    vacancies,
    applications,
    users,
    currentUser,
    departments,
    requestViewIntent,
    setRequestViewIntent,
    createVacancyFromApprovedRequest,
    setActiveTab,
  } = useApp();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [hrNotes, setHrNotes] = useState('');
  const [ceoNotes, setCeoNotes] = useState('');
  const [ceoReject, setCeoReject] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);
  // Holds the actual File object while waiting for the request to be created
  const pendingFileRef = useRef<File | null>(null);
  const [pendingAction, setPendingAction] = useState<'draft' | 'submitted' | null>(
    null,
  );

  const [form, setForm] = useState<RecruitmentRequestFormPayload>({ ...EMPTY });

  const screenKey =
    portal === 'hm'
      ? 'hm-requisitions'
      : portal === 'hr'
        ? 'hr-requisitions'
        : portal === 'department_manager'
          ? 'dm-requisitions'
          : 'ceo-requisitions';
  const rootCrumb =
    portal === 'hm'
      ? 'Hiring Manager'
      : portal === 'hr'
        ? 'HR'
        : portal === 'department_manager'
          ? 'Department Manager'
          : 'CEO Workspace';

  useEffect(() => {
    dispatch(recruitmentRequestsActions.fetchRequestsRequest());
  }, [dispatch]);

  // When a new request is created and we have a pending file,
  // upload it immediately using the new request's ID from Redux
  useEffect(() => {
    if (!lastCreatedRequestId) return;
    if (!pendingFileRef.current) return;

    const file = pendingFileRef.current;
    pendingFileRef.current = null;

    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token') || '';
    const fd = new FormData();
    fd.append('document', file);

    fetch(`${base}${API_ROUTES.recruitment.uploadDocument(lastCreatedRequestId)}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.status === 'success') {
          toast('Supporting document uploaded successfully.', 'success');
          dispatch(recruitmentRequestsActions.fetchRequestsRequest());
        } else {
          toast('Document upload failed — open the request to re-attach.', 'error');
        }
      })
      .catch(() => {
        toast('Document upload failed — open the request to re-attach.', 'error');
      });
  }, [lastCreatedRequestId]);

  useEffect(() => {
    if (!pendingAction || actionLoading) return;

    if (actionError) {
      toast(actionError, 'error');
      setPendingAction(null);
      return;
    }

    toast(
      pendingAction === 'draft'
        ? 'Draft request saved.'
        : 'Request submitted. HR will review next.',
      'success',
    );
    setPendingAction(null);
    setView('list');
    setSelectedId(null);
    setEditingId(null);
    resetForm();  }, [actionError, actionLoading, pendingAction, resetForm, toast]);

  // ── Real hiring managers from backend ──────────────────────────────────────
  const [backendHiringManagers, setBackendHiringManagers] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >(
    // Seed from context users while the API loads
    users
      .filter((u) => u.roleSlug === 'hiring_manager')
      .map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })),
  );

  useEffect(() => {
    apiFetch(API_ROUTES.users.hiringManagers)
      .then((res: any) => {
        const rows: Array<any> = Array.isArray(res?.data) ? res.data : [];
        if (rows.length > 0) {
          setBackendHiringManagers(
            rows.map((u) => ({
              id: u.id,
              firstName: u.firstName ?? u.first_name ?? '',
              lastName: u.lastName ?? u.last_name ?? '',
            })),
          );
        }
      })
      .catch(() => {
        // silently keep the context-seeded fallback
      });
  }, []);

  const hiringManagers = backendHiringManagers;

  const resetForm = useCallback(() => {
    const defaultDept =
      portal === 'department_manager'
        ? {
            id: currentUser.departmentId || '',
            name: currentUser.departmentName || '',
          }
        : departments[0] || { id: '', name: '' };
    setForm({
      ...EMPTY,
      hiringManagerId:
        portal === 'hm'
          ? currentUser.id
          : hiringManagers[0]?.id || currentUser.id,
      departmentId: defaultDept.id,
      departmentName: defaultDept.name,
    });
    setDocUploaded(false);
    setEditingId(null);
  }, [currentUser, departments, hiringManagers, portal]);
  const loadRequest = useCallback((req: RecruitmentRequest) => {
    setForm(payloadFromRequest(req));
    setDocUploaded(Boolean(req.supportingDocumentName));
    setEditingId(req.id);
    setView('create');
  }, []);

  useEffect(() => {
    if (requestViewIntent === 'create') {
      resetForm();
      setView('create');
      setRequestViewIntent(null);
    } else if (requestViewIntent && typeof requestViewIntent === 'object') {
      const req = recruitmentRequests.find(
        (r) => r.id === requestViewIntent.edit,
      );
      if (req) loadRequest(req);
      setRequestViewIntent(null);
    }
  }, [
    requestViewIntent,
    recruitmentRequests,
    loadRequest,
    resetForm,
    setRequestViewIntent,
  ]);

  const visibleRequests = recruitmentRequests
    .filter((r) => {
      if (
        portal === 'hm' &&
        r.hiringManagerId !== currentUser.id &&
        r.requestedBy !== currentUser.id
      )
        return false;
      if (
        portal === 'ceo' &&
        r.status !== 'pending_ceo' &&
        view === 'list' &&
        filterStatus === 'all'
      ) {
        /* CEO list defaults to actionable + all for detail navigation */
      }
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.requestTitle.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.referenceCode.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchType = filterType === 'all' || r.requestType === filterType;
      return matchSearch && matchStatus && matchType;
    })
    .map((r) => {
      // Resolve the hiring manager name from the backend users list
      // so the correct person (e.g. Maya) is shown, not the submitter (David)
      if (!r.hiringManagerId) return r;
      const resolved = backendHiringManagers.find(
        (hm) => hm.id === r.hiringManagerId,
      );
      if (!resolved) return r;
      const resolvedName = `${resolved.firstName} ${resolved.lastName}`;
      if (resolvedName === r.hiringManagerName) return r;
      return { ...r, hiringManagerName: resolvedName };
    });

  const buildPayload = (): RecruitmentRequestFormPayload => {
    const base = {
      ...form,
      supportingDocumentName: docUploaded
        ? form.supportingDocumentName || 'supporting_doc.pdf'
        : undefined,
    };
    // Resolve hiring manager name so it round-trips to the DB
    if (base.hiringManagerId && !base.hiringManagerName) {
      if (base.requestType === 'planned' && selectedWorkforcePlan?.createdByName) {
        (base as any).hiringManagerName =
          selectedWorkforcePlan.createdByName.trim();
      } else {
        const resolvedName = resolveHiringManagerName(
          base.hiringManagerId,
          backendHiringManagers,
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

  const handleSaveDraft = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const payload = buildPayload();
    const err = validateRequestPayload(payload, false);
    if (err) {
      toast(err, 'error');
      return;
    }

    if (editingId) {
      dispatch(
        recruitmentRequestsActions.updateRequestRequest({
          requestId: editingId,
          data: payload,
          options: { saveAsDraft: true },
        }),
      );
    } else {
      dispatch(
        recruitmentRequestsActions.createRequestRequest({
          data: payload,
          status: 'draft',
        }),
      );
    }
    setPendingAction('draft');
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    const err = validateRequestPayload(payload, true);
    if (err) {
      toast(err, 'error');
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
    const payload = buildPayload();
    if (editingId) {
      dispatch(
        recruitmentRequestsActions.updateRequestRequest({
          requestId: editingId,
          data: payload,
          options: { submit: true },
        }),
      );
    } else {
      dispatch(
        recruitmentRequestsActions.createRequestRequest({
          data: payload,
          status: 'submitted',
        }),
      );
    }
    setShowSubmitConfirm(false);
    setPendingAction('submitted');
  };

  function setField<K extends keyof RecruitmentRequestFormPayload>(
    key: K,
    value: RecruitmentRequestFormPayload[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const setCustomFieldValue = (fieldId: string, value: string) => {
    setForm((current) => ({
      ...current,
      customFieldValues: {
        ...(current.customFieldValues || {}),
        [fieldId]: value,
      },
    }));
  };

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
        priority: prev.priority || selectedPlanItem.priority || 'Medium',
        jobTitle: prev.jobTitle || selectedPlanItem.jobTitle,
        numberOfOpenings:
          prev.numberOfOpenings || selectedPlanItem.headcountRequired,
        employmentType: prev.employmentType || selectedPlanItem.employmentType,
        location: staffing.location || prev.location,
        hiringManagerId: staffing.hiringManagerId || prev.hiringManagerId,
      }));
    }
  }, [selectedPlanItem, selectedWorkforcePlan]);

  const canCreate =
    portal === 'hm' || portal === 'hr' || portal === 'department_manager';

  return (
    <div className="space-y-lg">
      <FrDemoPanel
        screenKey={screenKey}
        requirements={getFrForScreen(screenKey)}
      />

      <TraceabilityBanner />

      <nav className="flex items-center gap-2 text-sm text-on-surface-variant font-medium flex-wrap">
        <span
          className="hover:text-primary cursor-pointer"
          onClick={() => {
            setView('list');
            resetForm();
          }}
        >
          {rootCrumb}
        </span>
        <span className="material-symbols-outlined text-[12px]">
          chevron_right
        </span>
        <span
          className="hover:text-primary cursor-pointer"
          onClick={() => {
            setView('list');
            resetForm();
          }}
        >
          Recruitment Requests
        </span>
        {view === 'create' && (
          <>
            <span className="material-symbols-outlined text-[12px]">
              chevron_right
            </span>
            <span className="text-primary font-bold">
              {editingId ? 'Edit Request' : 'Create Request'}
            </span>
          </>
        )}
        {view === 'detail' && (
          <>
            <span className="material-symbols-outlined text-[12px]">
              chevron_right
            </span>
            <span className="text-primary font-bold">Request Detail</span>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_minmax(280px,1fr)] items-center border-b border-outline-variant pb-md">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-primary/70 font-semibold">
            Recruitment requests
          </p>
          <h2 className="font-display-lg text-display-lg text-slate-950">
            Modern hiring workflow for your team
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Create, submit, review, and approve recruitment requests using a
            clear, modern experience designed for Hiring Managers, HR reviewers,
            and CEOs.
          </p>
        </div>

        <div className="rounded-3xl border border-outline-variant bg-slate-50 p-6 shadow-sm flex items-center justify-center">
          {view === 'list' && canCreate ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView('create');
              }}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New request
            </button>
          ) : (
            <div className="text-sm text-slate-500">&nbsp;</div>
          )}
        </div>
      </div>

      {view === 'list' && (
        <RecruitmentRequestList
          portal={portal}
          requests={visibleRequests}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterType={filterType}
          setFilterType={setFilterType}
          currentUserId={currentUser.id}
          onSelect={(id) => {
            setSelectedId(id);
            setView('detail');
          }}
          onEdit={loadRequest}
          users={users}
        />
      )}

      {view === 'create' && canCreate && (
        <RecruitmentRequestCreateForm
          form={form}
          setField={setField}
          docUploaded={docUploaded}
          setDocUploaded={setDocUploaded}
          editingId={editingId}
          onFileSelected={(file) => { pendingFileRef.current = file; }}
          hiringManagers={hiringManagers}
          departments={departments}
          workforcePlans={workforcePlans.filter((w) => w.status === 'approved')}
          selectedWorkforcePlan={selectedWorkforcePlan}
          users={users}
          customFieldValues={form.customFieldValues || {}}
          setCustomFieldValue={setCustomFieldValue}
          isSaving={actionLoading}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitClick}
          onCancel={() => {
            resetForm();
            setView('list');
          }}
        />
      )}

      {view === 'create' && !canCreate && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-md rounded-xl">
          Requests are created by Hiring Managers. Switch to Hiring Manager role
          to create requests.
        </p>
      )}

      {view === 'detail' &&
        selectedId &&
        (() => {
          const selectedRequest = recruitmentRequests.find(
            (r) => r.id === selectedId,
          );
          return selectedRequest ? (
            <DetailView
              req={selectedRequest}
              portal={portal}
              workforcePlans={workforcePlans}
              vacancies={vacancies}
              applications={applications}
              hrNotes={hrNotes}
              setHrNotes={setHrNotes}
              ceoNotes={ceoNotes}
              setCeoNotes={setCeoNotes}
              ceoReject={ceoReject}
              setCeoReject={setCeoReject}
              onHrReview={(
                requestId: string,
                action: 'approve' | 'reject',
                notes?: string,
              ) =>
                dispatch(
                  recruitmentRequestsActions.hrReviewRequestRequest({
                    requestId,
                    action,
                    notes,
                  }),
                )
              }
              onCeoApprove={(requestId: string, notes?: string) =>
                dispatch(
                  recruitmentRequestsActions.ceoApproveRequestRequest({
                    requestId,
                    notes,
                  }),
                )
              }
              onCeoReject={(requestId: string, reason: string) =>
                dispatch(
                  recruitmentRequestsActions.rejectRequestRequest({
                    requestId,
                    reason,
                  }),
                )
              }
              onReopen={(requestId: string) =>
                dispatch(
                  recruitmentRequestsActions.reopenRequestRequest({
                    requestId,
                  }),
                )
              }
              onCreateVacancy={createVacancyFromApprovedRequest}
              setRequestViewIntent={setRequestViewIntent}
              setActiveTab={setActiveTab}
              setView={setView}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-700 shadow-sm">
              Loading request details…
            </div>
          );
        })()}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md">
          <div className="bg-white rounded-xl p-lg max-w-md w-full shadow-xl space-y-md">
            <h3 className="font-bold text-primary">Confirm Submission</h3>
            <p className="text-xs text-on-surface-variant">
              Submit request for HR review? Planned requests require workforce
              plan linkage.
            </p>
            <div className="flex gap-sm justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-md py-sm text-xs border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                className="px-md py-sm text-xs bg-primary text-white font-bold rounded-lg"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TraceabilityBanner() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-3xl px-6 py-4 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-primary">
      <span className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">
          event_seat
        </span>
        Workforce Plan
      </span>
      <span className="material-symbols-outlined text-[12px]">
        arrow_forward
      </span>
      <span className="flex items-center gap-xs">
        <span className="material-symbols-outlined text-[14px]">
          assignment
        </span>{' '}
        Recruitment Request
      </span>
      <span className="material-symbols-outlined text-[12px]">
        arrow_forward
      </span>
      <span className="flex items-center gap-xs">
        <span className="material-symbols-outlined text-[14px]">work</span>{' '}
        Vacancy
      </span>
      <span className="material-symbols-outlined text-[12px]">
        arrow_forward
      </span>
      <span className="flex items-center gap-xs">
        <span className="material-symbols-outlined text-[14px]">groups</span>{' '}
        Candidates
      </span>
    </div>
  );
}

function DetailView({
  req,
  portal,
  workforcePlans,
  vacancies,
  applications,
  hrNotes,
  setHrNotes,
  ceoNotes,
  setCeoNotes,
  ceoReject,
  setCeoReject,
  onHrReview,
  onCeoApprove,
  onCeoReject,
  onReopen,
  onCreateVacancy,
  setRequestViewIntent,
  setActiveTab,
  setView,
}: {
  req: RecruitmentRequest;
  portal: Portal;
  workforcePlans: { id: string; title: string }[];
  vacancies: { id: string; recruitmentRequestId: string; title: string }[];
  applications: { vacancyId: string }[];
  hrNotes: string;
  setHrNotes: (v: string) => void;
  ceoNotes: string;
  setCeoNotes: (v: string) => void;
  ceoReject: string;
  setCeoReject: (v: string) => void;
  onHrReview: (
    id: string,
    action: 'approve' | 'reject',
    notes?: string,
  ) => void;
  onCeoApprove: (id: string, notes?: string) => void;
  onCeoReject: (id: string, reason: string) => void;
  onReopen: (id: string) => void;
  onCreateVacancy: (id: string) => string | null;
  setRequestViewIntent: (v: 'create' | { edit: string } | null) => void;
  setActiveTab: (t: string) => void;
  setView: (view: 'list' | 'create' | 'detail') => void;
}) {
  if (!req) return null;
  const plan = workforcePlans.find((w) => w.id === req.workforcePlanId);
  const vacancy = vacancies.find(
    (v) => v.id === req.linkedVacancyId || v.recruitmentRequestId === req.id,
  );
  const candidateCount = vacancy
    ? applications.filter((a) => a.vacancyId === vacancy.id).length
    : 0;
  const steps = getApprovalSteps(req.status);

  return (
    <div className="grid grid-cols-12 gap-lg">
      <div className="col-span-12 lg:col-span-8 space-y-md text-xs">
        <div className="space-y-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-lg shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="text-sm font-semibold text-primary hover:text-primary/80"
                >
                  ← Back to requests
                </button>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">
                    {req.referenceCode}
                  </p>
                  <h3 className="font-headline-md text-slate-950 mt-3">
                    {req.requestTitle}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {req.jobTitle} • {req.departmentName}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                <span
                  className={`rounded-full px-3 py-1 ${statusBadge(req.status).className}`}
                >
                  {statusBadge(req.status).label}
                </span>
                <span className="text-slate-500 text-xs">
                  {req.createdAt?.slice(0, 10)}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant font-semibold">
                  Request type
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {req.requestType}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant font-semibold">
                  Workforce plan
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {plan
                    ? plan.title
                    : req.requestType === 'unplanned'
                      ? 'Unplanned request'
                      : 'Pending reference'}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant font-semibold">
                  Vacancy
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {vacancy ? vacancy.title : 'Not created yet'}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant font-semibold">
                  Candidates
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {candidateCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-lg space-y-4 shadow-sm">
            <div>
              <p className="font-bold text-slate-900">Hiring Manager</p>
              <p className="text-slate-600">{req.hiringManagerName}</p>
            </div>
            {req.isReplacement && (
              <div className="bg-amber-50 p-4 rounded-3xl border border-amber-200">
                <p className="font-semibold text-amber-900">
                  Replacement:{' '}
                  {req.replacementForEmployee ||
                    `Employee ${req.replacementEmployeeId}`}
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  ID: {req.replacementEmployeeId} • Reason:{' '}
                  {req.replacementReason}
                </p>
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900">Justification</p>
              <p className="mt-2 text-slate-600 italic">{req.justification}</p>
            </div>
            {req.supportingDocumentName && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <p className="font-bold text-slate-900">Supporting Document</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">description</span>
                  <a 
                    href={req.supportingDocumentName.startsWith('http') ? req.supportingDocumentName : `${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000'}${req.supportingDocumentName}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-primary hover:underline font-semibold text-sm"
                  >
                    {req.supportingDocumentName.split('/').pop() || 'Download Document'}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-md border-b font-semibold text-slate-900">
              Activity & Audit Trail
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b uppercase text-on-surface-variant">
                    <th className="p-sm">Date</th>
                    <th className="p-sm">Author</th>
                    <th className="p-sm">Change</th>
                    <th className="p-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(req.activities || []).map((act) => (
                    <tr key={act.id} className="border-t">
                      <td className="p-sm">{act.timestamp.slice(0, 10)}</td>
                      <td className="p-sm">{act.actorName}</td>
                      <td className="p-sm">{act.action}</td>
                      <td className="p-sm">Activity</td>
                    </tr>
                  ))}
                  {req.revisions.map((rev, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-sm">{rev.date}</td>
                      <td className="p-sm">{rev.author}</td>
                      <td className="p-sm">{rev.changes}</td>
                      <td className="p-sm">{rev.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-md text-xs">
        <div className="bg-white border border-slate-200 rounded-3xl p-lg space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Approval Progress</p>
              <p className="text-sm text-slate-500 mt-1">
                Follow each step through HR and CEO review.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {req.status.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={step.label} className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${step.done ? 'bg-emerald-600 text-white' : step.active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <div>
                  <p
                    className={`text-sm ${step.active ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {portal === 'hr' &&
          ['submitted', 'under_review'].includes(req.status) && (
            <div className="bg-white border border-slate-200 rounded-3xl p-lg space-y-4 shadow-sm">
              <div>
                <p className="font-semibold text-slate-900">HR Review</p>
                <p className="text-sm text-slate-500 mt-1">
                  Add notes for the CEO or record reasons for a return.
                </p>
              </div>
              <textarea
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                className="w-full min-h-30 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Review notes..."
              />
              <button
                type="button"
                onClick={() => onHrReview(req.id, 'approve', hrNotes)}
                className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/95"
              >
                Approve to CEO
              </button>
              <button
                type="button"
                onClick={() => onHrReview(req.id, 'reject', hrNotes)}
                className="w-full rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Reject Request
              </button>
            </div>
          )}

        {portal === 'ceo' && req.status === 'pending_ceo' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-lg space-y-4 shadow-sm">
            <div>
              <p className="font-semibold text-slate-900">CEO Approval</p>
              <p className="text-sm text-slate-500 mt-1">
                Add comments before approving or rejecting this recruitment
                request.
              </p>
            </div>
            <textarea
              rows={3}
              value={ceoNotes}
              onChange={(e) => setCeoNotes(e.target.value)}
              className="w-full min-h-30 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Approval notes (optional)"
            />
            <button
              type="button"
              onClick={() => onCeoApprove(req.id, ceoNotes)}
              className="w-full rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
            >
              Approve Request
            </button>
            <textarea
              rows={3}
              value={ceoReject}
              onChange={(e) => setCeoReject(e.target.value)}
              className="w-full min-h-30 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
              placeholder="Rejection reason"
            />
            <button
              type="button"
              onClick={() => onCeoReject(req.id, ceoReject)}
              className="w-full rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Reject Request
            </button>
          </div>
        )}

        {portal === 'hr' && req.status === 'approved' && (
          <button
            type="button"
            onClick={() => {
              const vacId = onCreateVacancy(req.id);
              if (vacId) setActiveTab('vacancies');
            }}
            className="w-full bg-primary text-white py-sm font-bold rounded-lg"
          >
            {req.linkedVacancyId
              ? 'Open Linked Vacancy'
              : 'Create Vacancy from Request'}
          </button>
        )}

        {req.status === 'rejected' && portal === 'hm' && (
          <button
            type="button"
            onClick={() => {
              onReopen(req.id);
              setRequestViewIntent({ edit: req.id });
            }}
            className="w-full border-2 border-amber-400 text-amber-800 py-sm font-bold rounded-lg"
          >
            Revise & Resubmit
          </button>
        )}
      </div>
    </div>
  );
}
