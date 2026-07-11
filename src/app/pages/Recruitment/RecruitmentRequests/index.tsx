import { useRecruitmentRequestsSlice } from './slice';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { recruitmentRequestsActions } from './slice';
import {
  selectRecruitmentRequests,
  selectRecruitmentRequestsLoading,
  selectRecruitmentRequestsError,
  selectRecruitmentRequestsActionError,
  selectRecruitmentRequestsActionSuccess,
  selectRecruitmentRequestsDepartments,
} from './slice/selectors';
import type { RecruitmentRequest } from '@/types';
import { useToast } from '@/components/common/Toast';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import { API_ROUTES } from '@/API/apiRoutes';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from '@/hooks/useSession';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  fetchHiringManagerOptions,
  withResolvedHiringManagerName,
  type HiringManagerOption,
} from './api';

export const RecruitmentRequestListPage: React.FC = () => {
  useRecruitmentRequestsSlice();
  const navigate = useNavigate();
  const { toast } = useToast();
  const recruitmentRequests = useAppSelector(selectRecruitmentRequests);
  const loading = useAppSelector(selectRecruitmentRequestsLoading);
  const error = useAppSelector(selectRecruitmentRequestsError);
  const actionError = useAppSelector(selectRecruitmentRequestsActionError);
  const actionSuccess = useAppSelector(selectRecruitmentRequestsActionSuccess);
  const departments = useAppSelector(selectRecruitmentRequestsDepartments);
  const { can } = usePermissions();
  const { user: currentUser } = useSession();
  const dispatch = useAppDispatch();
  const [hiringManagers, setHiringManagers] = useState<HiringManagerOption[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    fetchHiringManagerOptions()
      .then((rows) => {
        if (!cancelled) {
          setHiringManagers(rows);
        }
      })
      .catch(() => {
        // list can still render without resolved names
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Auto-fill department filter for department manager
  useEffect(() => {
    if (currentUser?.roleSlug === 'department_manager' && currentUser.departmentId) {
      setFilterDepartment(currentUser.departmentId);
    }
  }, [currentUser]);
  // Separate state for HR review notes and reject reason so they don't bleed into each other
  const [hrNotes, setHrNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [ceoNotes, setCeoNotes] = useState('');
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewType, setDocumentPreviewType] = useState('');
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewError, setDocumentPreviewError] = useState<string | null>(null);

  // Reset action notes when the modal changes to a different request
  const prevSelectedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (selectedId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedId;
      setHrNotes('');
      setRejectReason('');
      setCeoNotes('');
      setIsDocumentPreviewOpen(false);
    }
  }, [selectedId]);

  const getRequestDisplayTitle = (request: RecruitmentRequest) =>
    request.requestTitle ||
    request.positionName ||
    request.jobTitle ||
    'Recruitment request';

  const getRequestDisplayCode = (request: RecruitmentRequest) =>
    request.referenceCode || `REQ-${request.id?.slice(-6).toUpperCase()}`;

  const resolvedRequests = useMemo(
    () =>
      recruitmentRequests.map((request) =>
        withResolvedHiringManagerName(request, hiringManagers),
      ),
    [recruitmentRequests, hiringManagers],
  );

  const visibleRequests = useMemo(() => {
    return resolvedRequests.filter((r) => {
      // Role scope restriction
      if (currentUser?.roleSlug === 'hiring_manager' && r.hiringManagerId !== currentUser.id) {
        return false;
      }
      const q = search.toLowerCase();
      const title = getRequestDisplayTitle(r).toLowerCase();
      const code = getRequestDisplayCode(r).toLowerCase();
      const matchSearch =
        !q ||
        title.includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        code.includes(q);
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchDepartment =
        filterDepartment === 'all' || r.departmentId === filterDepartment;
      return matchSearch && matchStatus && matchDepartment;
    });
  }, [
    resolvedRequests,
    search,
    filterStatus,
    filterDepartment,
    currentUser,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(visibleRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return visibleRequests.slice(startIndex, endIndex);
  }, [visibleRequests, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterDepartment]);

  const selectedRequest = selectedId
    ? resolvedRequests.find((r) => r.id === selectedId) || null
    : null;

  const getSupportingDocumentLabel = (request: RecruitmentRequest | null) => {
    if (!request) return 'document';
    return (
      request.supportingDocumentName ||
      request.supportingDocumentUrl?.split('/').pop() ||
      'document'
    );
  };

  const getSupportingDocumentExtension = (request: RecruitmentRequest | null) =>
    getSupportingDocumentLabel(request).split('.').pop()?.toLowerCase() || '';

  const openDocumentPreview = async () => {
    if (!selectedRequest) return;

    setIsDocumentPreviewOpen(true);
    setDocumentPreviewLoading(true);
    setDocumentPreviewError(null);

    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
      setDocumentPreviewUrl(null);
    }

    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || '';
      const response = await fetch(
        `${base}${API_ROUTES.recruitment.document(selectedRequest.id)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Unable to load supporting document.');
      }

      const blob = await response.blob();
      setDocumentPreviewType(blob.type || getSupportingDocumentExtension(selectedRequest));
      setDocumentPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      setDocumentPreviewError(
        error instanceof Error
          ? error.message
          : 'Unable to load supporting document.',
      );
    } finally {
      setDocumentPreviewLoading(false);
    }
  };

  const stableDispatch = useAppDispatch();
 

  useEffect(() => {
    if (error) toast(error, 'error');
  }, [error, toast]);

  useEffect(() => {
    if (actionError) toast(actionError, 'error');
  }, [actionError, toast]);

  useEffect(() => {
    if (actionSuccess) toast(actionSuccess, 'success');
  }, [actionSuccess, toast]);

  useEffect(() => {
    return () => {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [documentPreviewUrl]);

  const canCreate = can(PERMISSIONS.RECRUITMENT_REQUEST_CREATE);
  const canApprove = can(PERMISSIONS.RECRUITMENT_REQUEST_APPROVE);
  const canReject = can(PERMISSIONS.RECRUITMENT_REQUEST_REJECT);
  const canUpdate = can(PERMISSIONS.RECRUITMENT_REQUEST_UPDATE);
  const canRead = can(PERMISSIONS.RECRUITMENT_REQUEST_READ); 

  useEffect(() => {
    if (!canRead) return; // 🚀 stop dispatch completely

    stableDispatch(recruitmentRequestsActions.fetchRequestsRequest());
  }, [stableDispatch, canRead]);

  // Helper function for dynamic color configurations on status markers
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending_ceo':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm text-slate-800 animate-fade-in">
      {/* Top Banner Action Layout */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
           <p className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
            Recruitment Requisitions
          </p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Requisition Authorizations & Approvals
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Review budget alignments, panel requests, and HR evaluations.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2 self-start sm:self-auto"
            onClick={() => navigate('/dashboard/recruitment-requests/create')}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Request
          </button>
        ) : (
          <div className="text-xs text-slate-500">
            You can review recruitment requests, but cannot create new ones
            with your current permissions.
          </div>
        )}
      </div>

      {/* Structured Filtering Matrix */}
      <FilterToolbar
        fields={[
          {
            key: 'search',
            label: 'Search requests',
            type: 'search',
            placeholder: 'Requisition title, code...',
            value: search,
            onChange: setSearch,
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_review', label: 'Pending CEO' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
          {
            key: 'department',
            label: 'Department',
            type: 'select',
            value: filterDepartment,
            onChange: setFilterDepartment,
            options: [
              { value: 'all', label: 'All Departments' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ],
          },
        ]}
        onClear={() => {
          setSearch('');
          setFilterStatus('all');
          setFilterDepartment('all');
        }}
        resultCount={visibleRequests.length}
        resultLabel="requisitions"
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!canRead ? (
  //  No access
  <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-500">
    You do not have permission to view recruitment requests.
  </div>
) : loading ? (
  //  Loading
  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
    Loading recruitment requests...
  </div>
) : (
  // Actual Table
  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
          <th className="p-4 font-semibold">Requisition</th>
          <th className="p-4 font-semibold">Department</th>
          <th className="p-4 font-semibold">Hiring Manager</th>
          <th className="p-4 font-semibold">Headcount</th>
          <th className="p-4 font-semibold">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {paginatedRequests.map((r) => (
          <tr
            key={r.id}
            className="cursor-pointer hover:bg-slate-50/80 transition-colors duration-150"
            onClick={() => setSelectedId(r.id)}
          >
            <td className="p-4 max-w-xs">
              <p className="font-semibold text-slate-900 truncate">
                {getRequestDisplayTitle(r)}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {getRequestDisplayCode(r)}{' '}
                <span className="text-slate-200 mx-1">•</span>{' '}
                {r.jobTitle}
              </p>
            </td>

            <td className="p-4 font-medium text-slate-600">
              {r.departmentName}
            </td>

            <td className="p-4 text-slate-500 font-medium">
              {r.hiringManagerName}
            </td>

            <td className="p-4 font-bold text-slate-800">
              {r.numberOfOpenings}
            </td>

            <td className="p-4">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusStyles(
                  r.status
                )}`}
              >
                {r.status.replace('_', ' ')}
              </span>
            </td>
          </tr>
        ))}

        {visibleRequests.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="p-8 text-center text-slate-400 italic bg-white"
            >
              No recruitment requests found matching your filter parameters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
    {totalPages > 1 && (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, visibleRequests.length)} of {visibleRequests.length} requisitions
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    )}
  </div>
)}

      {/* Detail Overlay Sheet Drawer Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full flex flex-col shadow-2xl max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedRequest.referenceCode}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getStatusStyles(selectedRequest.status)}`}>{selectedRequest.status.replace('_', ' ')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${selectedRequest.requestType === 'planned' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{selectedRequest.requestType}</span>
                  {selectedRequest.isReplacement && <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-200 uppercase">Replacement</span>}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedRequest.requestTitle}</h3>
                <p className="text-xs text-slate-500">Created {new Date(selectedRequest.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}{selectedRequest.requestedByName && ` · by ${selectedRequest.requestedByName}`}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Position details */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">work</span>Position Details</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Title</p><p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.jobTitle || '—'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p><p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.departmentName}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headcount</p><p className="font-bold text-indigo-600 text-lg mt-0.5">{selectedRequest.numberOfOpenings}</p></div>
                      {selectedRequest.employmentType && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Type</p><p className="font-semibold text-slate-900 mt-0.5 capitalize">{selectedRequest.employmentType.replace('_', ' ')}</p></div>}
                      {selectedRequest.grade && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</p><p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.grade}</p></div>}
                      {selectedRequest.location && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p><p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.location}</p></div>}
                      {selectedRequest.priority && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</p>
                        <span className={`inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${selectedRequest.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : selectedRequest.priority === 'Low' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{selectedRequest.priority}</span>
                      </div>}
                      {(selectedRequest.salaryMin || selectedRequest.salaryMax) && (
                        <div className="col-span-2 sm:col-span-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Range</p>
                          <p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.salaryMin?.toLocaleString() ?? '—'} – {selectedRequest.salaryMax?.toLocaleString() ?? '—'} ETB</p>
                        </div>
                      )}
                    </div>
                  </section>
                  {/* Workforce plan */}
                  {selectedRequest.workforcePlanReference && (
                    <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-indigo-500">link</span>
                      <div><p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Workforce Plan</p><p className="font-semibold text-indigo-900 text-sm">{selectedRequest.workforcePlanReference}</p></div>
                    </div>
                  )}
                  {/* Justification */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">description</span>Business Justification</h4>
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedRequest.justification}</p>
                  </section>
                  {/* Replacement */}
                  {selectedRequest.isReplacement && (
                    <section className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">autorenew</span>Replacement Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Replacing</p><p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.replacementForEmployee || selectedRequest.replacementEmployeeId || '—'}</p></div>
                        {selectedRequest.replacementReason && <div className="sm:col-span-2"><p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Reason</p><p className="text-slate-700 mt-0.5 italic">{selectedRequest.replacementReason}</p></div>}
                      </div>
                    </section>
                  )}
                  {/* Supporting Document — always visible */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">attach_file</span>
                      Supporting Document
                    </h4>
                    {selectedRequest.supportingDocumentName || selectedRequest.supportingDocumentUrl ? (
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                        <span className="material-symbols-outlined text-indigo-500 shrink-0">description</span>
                        <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                          {getSupportingDocumentLabel(selectedRequest)}
                        </span>
                        {selectedRequest.supportingDocumentName || selectedRequest.supportingDocumentUrl ? (
                          <button
                            type="button"
                            onClick={openDocumentPreview}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            View File
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-semibold shrink-0">
                            Pending upload
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                        No supporting document attached.
                      </p>
                    )}
                  </section>

                  {/* Review Notes — HR comments / rejection reason */}
                  {(selectedRequest.hrReviewNotes || selectedRequest.rejectionReason || selectedRequest.hrReviewedByName) && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">rate_review</span>
                        Review Notes
                      </h4>
                      {selectedRequest.hrReviewNotes && (
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HR Review Comment</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{selectedRequest.hrReviewNotes}</p>
                          {selectedRequest.hrReviewedByName && (
                            <p className="text-[10px] text-slate-400 mt-1">— {selectedRequest.hrReviewedByName}{selectedRequest.hrReviewDate && `, ${new Date(selectedRequest.hrReviewDate).toLocaleDateString()}`}</p>
                          )}
                        </div>
                      )}
                      {selectedRequest.rejectionReason && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Rejection Reason</p>
                          <p className="text-sm text-rose-700 leading-relaxed">{selectedRequest.rejectionReason}</p>
                          {selectedRequest.rejectedByName && (
                            <p className="text-[10px] text-rose-400 mt-1">— {selectedRequest.rejectedByName}</p>
                          )}
                        </div>
                      )}
                    </section>
                  )}
                </div>
                {/* Right: meta + actions */}
                <div className="lg:col-span-4 space-y-4">
                  <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiring Manager</p><p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.hiringManagerName || '—'}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headcount</p><p className="text-lg font-bold text-slate-900">{selectedRequest.numberOfOpenings}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusStyles(selectedRequest.status)}`}>{selectedRequest.status.replace('_', ' ')}</span>
                    </div>
                    {selectedRequest.approvedByName && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved By</p><p className="font-semibold text-emerald-700 mt-0.5">{selectedRequest.approvedByName}</p>{selectedRequest.approvedAt && <p className="text-[10px] text-slate-400">{new Date(selectedRequest.approvedAt).toLocaleDateString()}</p>}</div>}
                    {selectedRequest.rejectedByName && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected By</p><p className="font-semibold text-rose-700 mt-0.5">{selectedRequest.rejectedByName}</p></div>}
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</p><p className="text-xs text-slate-600 mt-0.5">{new Date(selectedRequest.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
                  </section>
                  {canApprove && selectedRequest.status === 'submitted' && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">HR Review</p>
                      <textarea rows={3} value={hrNotes} onChange={(e) => setHrNotes(e.target.value)} placeholder="Add HR review notes (will be saved and shown)..." className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" />
                      <button onClick={() => { dispatch(recruitmentRequestsActions.hrReviewRequestRequest({ requestId: selectedRequest.id, action: 'approve', notes: hrNotes })); setSelectedId(null); }} className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-indigo-700 transition">Approve & Route to CEO</button>
                    </section>
                  )}
                  {canApprove && selectedRequest.status === 'under_review' && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">CEO Approval</p>
                      <textarea rows={3} value={ceoNotes} onChange={(e) => setCeoNotes(e.target.value)} placeholder="Add CEO authorization comments (will be saved and shown)..." className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" />
                      <button onClick={() => { dispatch(recruitmentRequestsActions.approveRequestRequest({ requestId: selectedRequest.id })); setSelectedId(null); }} className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-emerald-700 transition">Approve & Authorize</button>
                    </section>
                  )}
                  {canReject && ['submitted', 'under_review'].includes(selectedRequest.status) && (
                    <section className="bg-white border border-rose-200 rounded-xl p-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Reject Request</p>
                      <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter rejection reason (will be saved and shown)..." className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none" />
                      <button
                        disabled={!rejectReason.trim()}
                        onClick={() => { dispatch(recruitmentRequestsActions.rejectRequestRequest({ requestId: selectedRequest.id, reason: rejectReason })); setSelectedId(null); }}
                        className="w-full bg-rose-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-rose-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reject Request
                      </button>
                    </section>
                  )}
                  {canUpdate && selectedRequest.status === 'draft' && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Actions</p>
                      <button
                        onClick={() => { navigate(`/dashboard/recruitment-requests/edit/${selectedRequest.id}`); setSelectedId(null); }}
                        className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit Request
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
                            dispatch(recruitmentRequestsActions.deleteRequestRequest({ requestId: selectedRequest.id }));
                            setSelectedId(null);
                          }
                        }}
                        className="w-full bg-rose-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-rose-700 transition flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete Request
                      </button>
                    </section>
                  )}
                  {selectedRequest.status === 'approved' && canUpdate && (
                    <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ready to hire</p>
                      <p className="text-xs text-emerald-800">Request is authorized. Create a vacancy to start recruiting.</p>
                      <button onClick={() => { navigate('/dashboard/vacancies'); setSelectedId(null); }} className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-indigo-700 transition flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>Generate Draft Vacancy
                      </button>
                    </section>
                  )}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end bg-slate-50 px-6 py-3 border-t border-slate-200 shrink-0">
              <button type="button" onClick={() => setSelectedId(null)} className="px-4 py-1.5 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs bg-white hover:bg-slate-50 transition shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}
      {isDocumentPreviewOpen && (
        <div
          className="fixed inset-0 z-[10010] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDocumentPreviewOpen(false);
          }}
        >
          <div className="relative w-full max-w-6xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h3 className="truncate text-lg font-semibold text-slate-900">
                {getSupportingDocumentLabel(selectedRequest)}
              </h3>
              <button
                type="button"
                onClick={() => setIsDocumentPreviewOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              {documentPreviewLoading ? (
                <div className="flex h-[70vh] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                  Loading document preview...
                </div>
              ) : documentPreviewError ? (
                <div className="flex h-[70vh] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 text-center text-rose-700">
                  {documentPreviewError}
                </div>
              ) : documentPreviewUrl ? (
                documentPreviewType.includes('image') ? (
                  <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={documentPreviewUrl}
                      alt={getSupportingDocumentLabel(selectedRequest)}
                      className="max-h-[66vh] w-auto rounded-lg shadow-sm"
                    />
                  </div>
                ) : documentPreviewType.includes('pdf') ||
                  getSupportingDocumentExtension(selectedRequest) === 'pdf' ? (
                  <iframe
                    src={documentPreviewUrl}
                    title={getSupportingDocumentLabel(selectedRequest)}
                    className="h-[70vh] w-full rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-6 text-center">
                    <p className="text-sm text-slate-600">
                      This file type cannot be previewed inline, but the document loaded successfully.
                    </p>
                    <a
                      href={documentPreviewUrl}
                      download={getSupportingDocumentLabel(selectedRequest)}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download file
                    </a>
                  </div>
                )
              ) : (
                <div className="flex h-[70vh] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                  No document preview available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecruitmentRequestListPage;
