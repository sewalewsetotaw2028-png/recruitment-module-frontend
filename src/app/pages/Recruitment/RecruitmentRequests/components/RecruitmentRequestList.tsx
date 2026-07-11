import React from 'react';
import type { RecruitmentRequest, User } from '@/types';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import { statusBadge } from '@/utils/recruitmentRequest';

interface RecruitmentRequestListProps {
  portal: 'hm' | 'hr' | 'ceo' | 'department_manager';
  requests: RecruitmentRequest[];
  search: string;
  setSearch: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  currentUserId: string;
  onSelect: (id: string) => void;
  onEdit: (req: RecruitmentRequest) => void;
  users: User[];
}

export const RecruitmentRequestList: React.FC<RecruitmentRequestListProps> = ({
  portal,
  requests,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  currentUserId,
  onSelect,
  onEdit,
}) => {
  const scoped = requests;

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterType('all');
  };

  return (
    <div className="space-y-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          {
            label: 'Pending / In Review',
            value: scoped.filter((r) =>
              ['submitted', 'under_review'].includes(r.status),
            ).length,
            color: 'text-amber-700',
            accent: 'bg-amber-50',
          },
          {
            label: 'Approved',
            value: scoped.filter((r) => r.status === 'approved').length,
            color: 'text-emerald-700',
            accent: 'bg-emerald-50',
          },
          {
            label: 'Unplanned',
            value: scoped.filter((r) => r.requestType === 'unplanned').length,
            color: 'text-orange-700',
            accent: 'bg-orange-50',
          },
          {
            label: 'Pending CEO',
            value: scoped.filter((r) => r.status === 'pending_ceo').length,
            color: 'text-purple-700',
            accent: 'bg-purple-50',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-3xl border border-slate-200 p-5 ${card.accent} shadow-sm transition hover:shadow-md`}
          >
            <p className={`text-3xl font-semibold ${card.color}`}>
              {card.value}
            </p>
            <p className="text-sm text-slate-600 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-slate-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Recruitment Requests Registry
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Review requests, filter by status, and open the detail panel to
                take action.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <FilterToolbar
              fields={[
                {
                  key: 'search',
                  label: 'Search requests',
                  type: 'search',
                  placeholder: 'Title, position, reference',
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
                    { value: 'all', label: 'All statuses' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'under_review', label: 'Under Review' },
                    { value: 'pending_ceo', label: 'Pending CEO' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ],
                },
                {
                  key: 'type',
                  label: 'Type',
                  type: 'select',
                  value: filterType,
                  onChange: setFilterType,
                  options: [
                    { value: 'all', label: 'All types' },
                    { value: 'planned', label: 'Planned' },
                    { value: 'unplanned', label: 'Unplanned' },
                  ],
                },
              ]}
              onClear={clearFilters}
              resultCount={scoped.length}
              resultLabel="requests"
            />
          </div>
        </div>
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-100 border-b text-xs uppercase text-slate-600">
              <th className="p-md text-sm">Reference</th>
              <th className="p-md text-sm">Request</th>
              <th className="p-md text-sm">Hiring Manager</th>
              <th className="p-md text-sm">Type / Plan</th>
              <th className="p-md text-sm">Status</th>
              <th className="p-md text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {scoped.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-lg text-center italic text-slate-500"
                >
                  No requests found. Adjust filters or create a new request.
                </td>
              </tr>
            ) : (
              scoped.map((req) => {
                const badge = statusBadge(req.status);
                return (
                  <tr
                    key={req.id}
                    className="group cursor-pointer transition duration-200 hover:bg-slate-50"
                    onClick={() => onSelect(req.id)}
                  >
                    <td className="p-md font-mono text-sm text-slate-800 font-semibold">
                      {req.referenceCode}
                    </td>
                    <td className="p-md">
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        {req.requestTitle}
                        {req.supportingDocumentName && (
                          <span className="material-symbols-outlined text-[14px] text-slate-400" title="Has supporting document">
                            attach_file
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {req.jobTitle} • {req.numberOfOpenings} opening(s)
                      </p>
                    </td>
                    <td className="p-md text-sm text-slate-600">
                      {req.hiringManagerName}
                    </td>
                    <td className="p-md space-y-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${req.requestType === 'planned' ? 'bg-indigo-50 text-indigo-800' : 'bg-amber-50 text-amber-800'}`}
                      >
                        {req.requestType}
                      </span>
                      {req.workforcePlanReference && (
                        <p
                          className="text-[11px] text-slate-500 truncate max-w-45"
                          title={req.workforcePlanReference}
                        >
                          🔗 {req.workforcePlanReference}
                        </p>
                      )}
                    </td>
                    <td className="p-md">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-md space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(req.id);
                        }}
                        className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        View
                      </button>
                      {portal === 'hm' &&
                        req.status === 'draft' &&
                        req.hiringManagerId === currentUserId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(req);
                            }}
                            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] font-semibold text-amber-900 transition hover:bg-amber-100"
                          >
                            Edit
                          </button>
                        )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
