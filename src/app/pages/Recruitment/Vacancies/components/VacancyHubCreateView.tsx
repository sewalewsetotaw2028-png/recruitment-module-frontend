import React from 'react';
import type { RecruitmentRequest, Vacancy } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface VacancyHubCreateViewProps {
  canCreate: boolean;
  manualTitle: string;
  manualDept: string;
  departments: string[];
  recruitmentRequests: RecruitmentRequest[];
  vacancies: Vacancy[];
  selectedRequestId: string;
  selectedRequest: RecruitmentRequest | null | undefined;
  onSelectedRequestChange: (value: string) => void;
  onCreateDraft: (event: React.FormEvent) => void;
  onManualTitleChange: (value: string) => void;
  onManualDeptChange: (value: string) => void;
  onCreateEmptyDraft: () => void;
}

export const VacancyHubCreateView: React.FC<VacancyHubCreateViewProps> = ({
  recruitmentRequests,
  vacancies,
  selectedRequestId,
  selectedRequest,
  onSelectedRequestChange,
  onCreateDraft,
}) => {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.VACANCY_CREATE);

  const availableRequests = recruitmentRequests.filter(
    (r) =>
      r.status === 'approved' &&
      !vacancies.some((v) => v.recruitmentRequestId === r.id),
  );

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center space-y-2">
        <span className="material-symbols-outlined text-3xl text-rose-400">lock</span>
        <p className="text-sm font-bold text-rose-700">Access restricted</p>
        <p className="text-xs text-rose-500">You do not have permission to create vacancies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-1 items-start">
        {/* Left Section: Create from Approved Recruitment Request */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[440px]">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
                Structured Provisioning
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-800 tracking-tight">
                Draft from recruitment request
              </h3>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Convert an approved requisition into a pre-filled vacancy draft
              with traceable tracking references.
            </p>
          </div>

          <div className="mt-6 flex-1 flex flex-col justify-end">
            {availableRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-800 bg-indigo-100">
                No approved requests available. Approve an open headcount
                request before initializing a traceable tracking link.
              </div>
            ) : (
              <form onSubmit={onCreateDraft} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Approved Request Track
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRequestId}
                      onChange={(e) => onSelectedRequestChange(e.target.value)}
                      required
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="">Choose an approved reference...</option>
                      {availableRequests.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.referenceCode} — {r.jobTitle}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                      <span className="material-symbols-outlined text-lg">
                        unfold_more
                      </span>
                    </div>
                  </div>
                </div>

                {selectedRequestId && selectedRequest && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 text-xs text-slate-600 space-y-2 font-semibold animate-fadeIn">
                    <p className="font-bold text-primary text-xs font-mono border-b border-slate-100 pb-2 mb-2">
                      {selectedRequest.referenceCode}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p>
                        <strong className="text-slate-800 font-bold">
                          Target Job:
                        </strong>{' '}
                        {selectedRequest.jobTitle}
                      </p>
                      <p>
                        <strong className="text-slate-800 font-bold">
                          Hiring Manager:
                        </strong>{' '}
                        {selectedRequest.hiringManagerName}
                      </p>
                      <p className="sm:col-span-2">
                        <strong className="text-slate-800 font-bold">
                          Workforce Reference:
                        </strong>{' '}
                        <span className="font-mono text-slate-500">
                          {selectedRequest.workforcePlanReference ||
                            'Unlinked Plan'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-300 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  Create Draft Vacancy Track
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
