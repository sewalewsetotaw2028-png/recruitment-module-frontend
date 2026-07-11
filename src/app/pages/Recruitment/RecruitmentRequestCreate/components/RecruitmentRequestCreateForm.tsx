import React, { useRef, useMemo, useState, useEffect } from 'react';
import CustomFieldInputs from '@/components/config/CustomFieldInputs';
import type { RecruitmentRequestFormPayload, User } from '@/types';
import { apiFetch } from '@/services/apiClient';
import { API_ROUTES } from '@/API/apiRoutes';

interface WorkforcePlanItem {
  id: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  headcountRequired: number;
  priority?: 'High' | 'Medium' | 'Low';
  employmentType?: 'full_time' | 'part_time' | 'contractor' | 'internship';
}

interface WorkforcePlan {
  id: string;
  title: string;
  planningPeriod: string;
  items: WorkforcePlanItem[];
}

interface RecruitmentRequestCreateFormProps {
  form: RecruitmentRequestFormPayload;
  setField: <K extends keyof RecruitmentRequestFormPayload>(
    key: K,
    value: RecruitmentRequestFormPayload[K],
  ) => void;
  docUploaded: boolean;
  setDocUploaded: (value: boolean) => void;
  /** The request ID once saved — needed to upload the document to the right record */
  editingId?: string | null;
  hiringManagers: Array<{ id: string; firstName: string; lastName: string }>;
  departments: Array<{ id: string; name: string }>;
  workforcePlans: WorkforcePlan[];
  selectedWorkforcePlan?: WorkforcePlan;
  users: User[];
  customFieldValues: Record<string, string>;
  setCustomFieldValue: (fieldId: string, value: string) => void;
  /** Called immediately when the user selects or removes a file */
  onFileSelected?: (file: File | null) => void;
  isSaving?: boolean;
  isSubmitting?: boolean;
  onSaveDraft: (e?: React.FormEvent) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

// Optimized helper using pre-normalized lookups if needed, or wrapped in hook logic
const findReplacementUser = (
  employeeId: string,
  users: User[],
): { found: boolean; name: string } => {
  if (!employeeId.trim()) return { found: false, name: '' };
  const normalized = employeeId.trim().toLowerCase();

  const matched = users.find((u) => {
    const idMatch = u.id?.toLowerCase() === normalized;
    const emailMatch = u.email?.toLowerCase().includes(normalized);
    const nameMatch = `${u.firstName || ''} ${u.lastName || ''}`
      .toLowerCase()
      .includes(normalized);
    return idMatch || emailMatch || nameMatch;
  });

  if (matched) {
    return { found: true, name: `${matched.firstName} ${matched.lastName}` };
  }
  return { found: false, name: '' };
};

export const RecruitmentRequestCreateForm: React.FC<
  RecruitmentRequestCreateFormProps
> = ({
  form,
  setField,
  docUploaded,
  setDocUploaded,
  editingId,
  hiringManagers,
  departments,
  workforcePlans,
  selectedWorkforcePlan,
  users,
  customFieldValues,
  setCustomFieldValue,
  onFileSelected,
  isSaving,
  onSaveDraft,
  onSubmit,
  onCancel,
  isEditMode = false,
}) => {
  const justificationMinLength = 50;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const openAttachmentPicker = () => fileInputRef.current?.click();

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onFileSelected?.(null);
      setDocUploaded(false);
      setField('supportingDocumentName', undefined);
      return;
    }

    // Store filename for display
    setField('supportingDocumentName', file.name);
    setDocUploaded(true);
    setUploadError(null);

    // Notify the Hub so it can hold the actual File object for later upload
    onFileSelected?.(file);

    // If we already have a saved request ID, upload immediately
    if (!editingId) return;

    setUploadingDoc(true);
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || '';
      const fd = new FormData();
      fd.append('document', file);
      const res = await fetch(
        `${base}${API_ROUTES.recruitment.uploadDocument(editingId)}`,
        { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd },
      );
      const json = await res.json();
      if (json.status === 'success') {
        setField('supportingDocumentName', file.name);
        setUploadError(null);
      } else {
        setUploadError('Upload failed — will retry after save.');
      }
    } catch {
      setUploadError('Upload failed — will retry after save.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Memoizing calculations to prevent unnecessary re-runs on every keystroke
  const selectedHiringManager = useMemo(
    () => hiringManagers.find((hm) => hm.id === form.hiringManagerId),
    [hiringManagers, form.hiringManagerId],
  );

  const isJustificationValid =
    form.justification.length >= justificationMinLength;

  // ── Real hiring managers from backend ──────────────────────────────────────
  // For unplanned requests the user picks the hiring manager freely.
  // For planned requests the manager is pre-determined by the plan item — read-only.
  const [backendHiringManagers, setBackendHiringManagers] = useState<
    Array<{ id: string; firstName: string; lastName: string; email?: string }>
  >(hiringManagers); // seed with prop fallback so UI is never empty

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
              email: u.email ?? '',
            })),
          );
        }
      })
      .catch(() => {
        // silently fall back to prop-supplied list
      });
  }, []);

  // Keep the prop list as a fallback merged in (avoids flash of empty)
  const resolvedHiringManagers = useMemo(() => {
    if (backendHiringManagers.length > 0) return backendHiringManagers;
    return hiringManagers;
  }, [backendHiringManagers, hiringManagers]);

  // ── Replacement employee real-time search ─────────────────────────────────
  // First try local users prop (fast); if nothing found after a debounce,
  // fall back to the backend /users API.
  const [replacementSearchState, setReplacementSearchState] = useState<
    'idle' | 'searching' | 'found' | 'not_found'
  >('idle');
  const [replacementResolvedName, setReplacementResolvedName] = useState('');
  const [replacementResolvedId, setReplacementResolvedId] = useState('');
  const replacementDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When the user clicks "autofill", we set this to true so the effect
  // triggered by the field change doesn't start a new search.
  const skipNextSearchRef = useRef(false);

  // Run search whenever the employee ID input changes
  useEffect(() => {
    const query = form.replacementEmployeeId?.trim() ?? '';

    // If this change was caused by the autofill click, skip the search
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (!query) {
      setReplacementSearchState('idle');
      setReplacementResolvedName('');
      return;
    }

    setReplacementSearchState('searching');

    // Cancel previous timer
    if (replacementDebounceRef.current) {
      clearTimeout(replacementDebounceRef.current);
    }

    replacementDebounceRef.current = setTimeout(async () => {
      // 1. Try local users first (instant)
      const local = findReplacementUser(query, users);
      if (local.found) {
        // Find the actual user to get their ID
        const normalized = query.trim().toLowerCase();
        const localUser = users.find((u) => {
          const idMatch = u.id?.toLowerCase() === normalized;
          const emailMatch = u.email?.toLowerCase().includes(normalized);
          const nameMatch = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(normalized);
          return idMatch || emailMatch || nameMatch;
        });
        setReplacementResolvedName(local.name);
        setReplacementResolvedId(localUser?.id ?? '');
        setReplacementSearchState('found');
        return;
      }

      // 2. Fall back to backend API search
      try {
        const res: any = await apiFetch(
          `${API_ROUTES.users.list}?search=${encodeURIComponent(query)}`,
        );
        const rows: Array<any> = Array.isArray(res?.data) ? res.data : [];
        if (rows.length > 0) {
          const u = rows[0];
          const name = `${u.firstName ?? u.first_name ?? ''} ${u.lastName ?? u.last_name ?? ''}`.trim();
          setReplacementResolvedName(name);
          setReplacementResolvedId(u.id ?? '');
          setReplacementSearchState('found');
        } else {
          setReplacementResolvedName('');
          setReplacementResolvedId('');
          setReplacementSearchState('not_found');
        }
      } catch {
        setReplacementResolvedName('');
        setReplacementResolvedId('');
        setReplacementSearchState('not_found');
      }
    }, 350); // 350ms debounce

    return () => {
      if (replacementDebounceRef.current) {
        clearTimeout(replacementDebounceRef.current);
      }
    };
  }, [form.replacementEmployeeId, users]);

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-12 gap-6 p-1">
      {/* Header Panel */}
      <div className="col-span-12 flex flex-col gap-4 rounded-3xl border border-indigo-600 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Recruitment request
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            {form.requestTitle
              ? "Edit Recruitment Request"
              : "Create Recruitment Request"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          ← Back to requests
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="col-span-12 xl:col-span-8 space-y-8 text-sm">
        {/* Section 1: Classification */}
        <section className="bg-white border border-indigo-600 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">
                1. Request Classification
              </p>
              <h3 className="text-lg font-semibold text-slate-950">
                Choose the request type
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 w-fit">
              {form.requestType === "planned" ? "Planned" : "Unplanned"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(["planned", "unplanned"] as const).map((type) => (
              <label
                key={type}
                className={`flex items-center gap-3 rounded-3xl border p-5 cursor-pointer transition ${
                  form.requestType === type
                    ? "border-indigo-600 bg-indig-200 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="requestType"
                  checked={form.requestType === type}
                  onChange={() => {
                    setField("requestType", type);
                    if (type === "unplanned") {
                      setField("workforcePlanId", undefined);
                      setField("workforcePlanItemId", undefined);
                    }
                  }}
                  className="h-4 w-4 text-white focus:ring-indigo"
                />
                <span className="font-semibold capitalize">
                  {type === "planned" ? "Planned Hiring" : "Unplanned Hiring"}
                </span>
              </label>
            ))}
          </div>

          {form.requestType === "planned" && (
            <div className="grid gap-4 animate-fadeIn">
              <label className="grid gap-2 text-sm font-semibold text-slate-900">
                Workforce plan reference
                <select
                  required
                  value={form.workforcePlanId || ""}
                  onChange={(e) => {
                    setField("workforcePlanId", e.target.value);
                    setField("workforcePlanItemId", "");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select approved workforce plan</option>
                  {workforcePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title} ({plan.planningPeriod})
                    </option>
                  ))}
                </select>
              </label>

              {selectedWorkforcePlan && (
                <label className="grid gap-2 text-sm font-semibold text-slate-900">
                  Workforce plan line item
                  <select
                    required
                    value={form.workforcePlanItemId || ""}
                    onChange={(e) =>
                      setField("workforcePlanItemId", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select plan line item</option>
                    {selectedWorkforcePlan.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.jobTitle} — {item.departmentName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Summary */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">
                2. Request Summary
              </p>
              <h3 className="text-lg font-semibold text-slate-950">
                Core request details
              </h3>
            </div>
            {form.requestType === 'unplanned' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                All fields required for unplanned
              </span>
            )}
          </div>

          {/* Request title — always visible */}
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Request title *
            <input
              required
              placeholder="e.g. Senior Backend Engineer"
              value={form.requestTitle || ''}
              onChange={(e) => setField('requestTitle', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Hiring manager — editable only for unplanned */}
            <label className="grid gap-2 text-sm font-semibold text-slate-900">
              Hiring manager {form.requestType === 'unplanned' ? '*' : ''}
              {form.requestType === 'unplanned' ? (
                <select
                  required
                  value={form.hiringManagerId || ''}
                  onChange={(e) => setField('hiringManagerId', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select hiring manager</option>
                  {resolvedHiringManagers.map((hm) => (
                    <option key={hm.id} value={hm.id}>
                      {hm.firstName} {hm.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={
                    selectedHiringManager
                      ? `${selectedHiringManager.firstName} ${selectedHiringManager.lastName}`
                      : resolvedHiringManagers.find((hm) => hm.id === form.hiringManagerId)
                          ? `${resolvedHiringManagers.find((hm) => hm.id === form.hiringManagerId)!.firstName} ${resolvedHiringManagers.find((hm) => hm.id === form.hiringManagerId)!.lastName}`
                          : 'Derived from plan'
                  }
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500 cursor-not-allowed"
                />
              )}
            </label>

            {/* Priority — always visible */}
            <label className="grid gap-2 text-sm font-semibold text-slate-900">
              Priority
              <select
                value={form.priority || 'Medium'}
                onChange={(e) => setField('priority', e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            {/* Department */}
            <div className="lg:col-span-2">
              {form.requestType === 'unplanned' ? (
                <label className="grid gap-2 text-sm font-semibold text-slate-900">
                  Department *
                  <select
                    required
                    value={form.departmentId || ''}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const dept = departments.find((d) => d.id === nextId);
                      setField('departmentId', nextId);
                      setField('departmentName', dept?.name || '');
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="grid gap-2 text-sm font-semibold text-slate-400">
                  Department (Derived from Plan)
                  <input
                    value={form.departmentName || ''}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500 cursor-not-allowed"
                  />
                </label>
              )}
            </div>
          </div>

          {/* ── Unplanned-only extended fields ─────────────────────────────── */}
          {form.requestType === 'unplanned' && (
            <div className="space-y-4 border-t border-slate-100 pt-6 animate-fadeIn">
              <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 font-semibold">
                Position details
              </p>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Job title */}
                <label className="grid gap-2 text-sm font-semibold text-slate-900">
                  Job title *
                  <input
                    required
                    placeholder="e.g. Software Engineer II"
                    value={form.jobTitle || ''}
                    onChange={(e) => setField('jobTitle', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                {/* Grade */}
                <label className="grid gap-2 text-sm font-semibold text-slate-900">
                  Job grade / level
                  <input
                    placeholder="e.g. P3, L5, Manager"
                    value={form.grade || ''}
                    onChange={(e) => setField('grade', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                {/* Employment type */}
                <label className="grid gap-2 text-sm font-semibold text-slate-900">
                  Employment type *
                  <select
                    required
                    value={form.employmentType || ''}
                    onChange={(e) => setField('employmentType', e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select type</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contractor">Contractor</option>
                    <option value="internship">Internship</option>
                  </select>
                </label>

                {/* Number of openings */}
                <label className="grid gap-2 text-sm font-semibold text-slate-900">
                  Number of openings *
                  <input
                    required
                    type="number"
                    min={1}
                    max={999}
                    placeholder="1"
                    value={form.numberOfOpenings ?? ''}
                    onChange={(e) =>
                      setField('numberOfOpenings', e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                {/* Location */}
                <label className="grid gap-2 text-sm font-semibold text-slate-900 lg:col-span-2">
                  Work location *
                  <input
                    required
                    placeholder="e.g. Addis Ababa HQ, Remote, Hybrid"
                    value={form.location || ''}
                    onChange={(e) => setField('location', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          )}

          {form.requestType === 'planned' && selectedWorkforcePlan && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                Linked Plan: {selectedWorkforcePlan.title}
              </p>
              <p>Period: {selectedWorkforcePlan.planningPeriod}</p>
            </div>
          )}
        </section>

        <CustomFieldInputs
          entityType="RecruitmentRequest"
          values={customFieldValues}
          onChange={setCustomFieldValue}
        />

        {/* Section 3: Replacement Hiring */}
        <section className="bg-amber-50/40 border border-amber-200 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-amber-800 font-semibold">
                3. Replacement Hiring
              </p>
              <h3 className="text-lg font-semibold text-slate-950">
                Replacement details
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 w-fit">
              {form.isReplacement ? "Replacement" : "New hire"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label
              className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition ${!form.isReplacement ? "border-amber-500 bg-white" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="isReplacement"
                checked={!form.isReplacement}
                onChange={() => setField("isReplacement", false)}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="font-medium text-slate-900">
                No — Fresh Headcount
              </span>
            </label>
            <label
              className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition ${form.isReplacement ? "border-amber-500 bg-white" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="isReplacement"
                checked={form.isReplacement}
                onChange={() => setField("isReplacement", true)}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="font-medium text-slate-900">
                Yes — Replacement Hiring
              </span>
            </label>
          </div>

         {form.isReplacement && (
      <div className="grid gap-4 animate-fadeIn">
        <label className="grid gap-2 text-sm font-semibold text-slate-900">
          Employee ID, name, or email *
          <div className="relative">
            <input
              required
              placeholder="Search by name, email, or employee ID..."
              value={form.replacementEmployeeId || ''}
              onChange={(e) => {
                setField("replacementEmployeeId", e.target.value)
              }}
              className={`w-full rounded-xl border px-4 py-3 font-normal text-slate-900 focus:outline-none focus:ring-1 transition-colors ${
                replacementSearchState === "found"
                  ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500"
                  : replacementSearchState === "not_found"
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 focus:border-amber-500 focus:ring-amber-500"
              } bg-white`}
            />

            {/* Status Icon */}
            <span className="absolute right-3 top-3.5 text-sm">
              {replacementSearchState === "searching" && (
                <span className="material-symbols-outlined animate-spin text-slate-400 text-base">
                  autorenew
                </span>
              )}
              {replacementSearchState === "found" && (
                <span className="material-symbols-outlined text-emerald-500 text-base">
                  check_circle
                </span>
              )}
              {replacementSearchState === "not_found" && (
                <span className="material-symbols-outlined text-rose-500 text-base">
                  cancel
                </span>
              )}
            </span>
          </div>
        </label>

        {/* ✅ Found Result */}
        {replacementSearchState === "found" && replacementResolvedName && (
          <button
            type="button"
            onClick={() => {
              skipNextSearchRef.current = true;
              setField("replacementEmployeeId", replacementResolvedId || replacementResolvedName);
              setReplacementSearchState("idle");
              setReplacementResolvedName("");
              setReplacementResolvedId("");
            }}
            className="w-full text-left rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 p-4 text-sm text-emerald-900 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <span className="material-symbols-outlined text-emerald-600 shrink-0">
              person_check
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-950">
                Employee found — click to select
              </p>
              <p className="font-normal mt-0.5 truncate">
                {replacementResolvedName}
              </p>
            </div>
            <span className="material-symbols-outlined text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        )}

        {/* ❌ Not Found */}
        {replacementSearchState === "not_found" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 shrink-0">
              person_off
            </span>
            <div>
              <p className="font-semibold">No employee found</p>
            </div>
          </div>
        )}

        {/* 🔄 Searching */}
        {replacementSearchState === "searching" && (
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm animate-spin">
              autorenew
            </span>
            Searching employees…
          </p>
        )}

        {/* 📝 Reason */}
        <label className="grid gap-2 text-sm font-semibold text-slate-900">
          Replacement reason *
          <textarea
            required
            placeholder="Provide details on why this replacement is necessary..."
            value={form.replacementReason || ""}
            onChange={(e) =>
              setField("replacementReason", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[100px]"
          />
        </label>
      </div>
    )}
        </section>

        {/* Section 4: Justification */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">
                4. Justification
              </p>
              <h3 className="text-lg font-semibold text-slate-950">
                Provide business rationale
              </h3>
            </div>
            <span className="text-sm text-slate-500">
              {(form.justification || "").length}/1000 characters
            </span>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Business justification *
            <textarea
              required
              minLength={justificationMinLength}
              rows={5}
              maxLength={1000}
              value={form.justification || ""}
              onChange={(e) => setField("justification", e.target.value)}
              placeholder="Provide a concise business justification for this opening..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[140px]"
            />
          </label>

          <p
            className={`text-xs font-semibold ${isJustificationValid ? "text-emerald-700" : "text-amber-800"}`}
          >
            {isJustificationValid
              ? "✓ Justification lengths meet minimum business constraints"
              : `⚠ Minimum ${justificationMinLength} characters required to submit.`}
          </p>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleAttachmentChange}
          />

          {!docUploaded ? (
            <button
              type="button"
              onClick={openAttachmentPicker}
              disabled={uploadingDoc}
              className="w-full rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary transition bg-indigo-500 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">attach_file</span>
              Attach supporting documents 
            </button>
          ) : (
            <div className="space-y-2">
              <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                uploadingDoc
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  : uploadError
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}>
                {uploadingDoc ? (
                  <span className="material-symbols-outlined animate-spin text-indigo-500 shrink-0">autorenew</span>
                ) : (
                  <span className="material-symbols-outlined shrink-0">
                    {uploadError ? 'warning' : 'check_circle'}
                  </span>
                )}
                <span className="truncate max-w-xs font-medium">
                  {uploadingDoc ? 'Uploading…' : form.supportingDocumentName}
                </span>
                {!uploadingDoc && (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      onFileSelected?.(null);
                      setDocUploaded(false);
                      setField('supportingDocumentName', undefined);
                      setUploadError(null);
                    }}
                    className="text-red-600 ml-auto text-xs font-semibold hover:underline shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  {uploadError} Save draft first, then re-attach.
                </p>
              )}
              {!editingId && !uploadError && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  File will be uploaded after you save or submit this request.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Sticky Preview Sidebar Container */}
      <aside className="col-span-12 xl:col-span-4 space-y-6 xl:sticky xl:top-6 h-fit">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">
            Request preview
          </p>
          <h3 className="text-lg font-bold text-slate-950 truncate">
            {form.requestTitle || "Untitled Recruitment Request"}
          </h3>

          <div className="space-y-3 border-t border-slate-200 pt-3 text-slate-600">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hiring Manager
              </p>
              <p className="text-slate-900 font-medium">
                {selectedHiringManager
                  ? `${selectedHiringManager.firstName} ${selectedHiringManager.lastName}`
                  : resolvedHiringManagers.find((hm) => hm.id === form.hiringManagerId)
                    ? `${resolvedHiringManagers.find((hm) => hm.id === form.hiringManagerId)!.firstName} ${resolvedHiringManagers.find((hm) => hm.id === form.hiringManagerId)!.lastName}`
                    : 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Department
              </p>
              <p className="text-slate-900 font-medium">
                {form.departmentName || 'Not selected'}
              </p>
            </div>
            {form.requestType === 'unplanned' && (
              <>
                {form.jobTitle && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Title</p>
                    <p className="text-slate-900 font-medium">{form.jobTitle}</p>
                  </div>
                )}
                {form.employmentType && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employment Type</p>
                    <p className="text-slate-900 font-medium capitalize">{form.employmentType.replace('_', ' ')}</p>
                  </div>
                )}
                {form.numberOfOpenings && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Openings</p>
                    <p className="text-slate-900 font-medium">{form.numberOfOpenings}</p>
                  </div>
                )}
                {form.location && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</p>
                    <p className="text-slate-900 font-medium">{form.location}</p>
                  </div>
                )}
                {form.grade && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade</p>
                    <p className="text-slate-900 font-medium">{form.grade}</p>
                  </div>
                )}
              </>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Priority Level
              </p>
              <p className="text-slate-900 font-medium">
                {form.priority || 'Medium'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Allocation Type
              </p>
              <p className="text-slate-900 font-medium capitalize">
                {form.requestType || 'unplanned'}
              </p>
            </div>
            {form.isReplacement && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 mt-2 text-xs text-amber-900">
                <span className="font-bold">Replacement Track Target:</span>
                <p className="truncate mt-0.5">
                  {form.replacementEmployeeId || 'Missing ID string'}
                </p>
              </div>
            )}
          </div>
        </div>

       
      </aside>

      {/* Footer Submission Container */}
      <div className="col-span-12 mt-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="text-slate-500 text-xs text-center sm:text-left">
            Review layout components carefully before clicking Submit for Approval".
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 w-full sm:w-auto"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="submit"
              disabled={!isJustificationValid || isSaving}
              className="rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSaving ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
