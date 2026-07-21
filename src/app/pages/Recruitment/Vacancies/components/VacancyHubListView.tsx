import React, { useState, useEffect, useMemo } from 'react';
import type { Application, RecruitmentRequest, Vacancy, VacancyStatus } from '@/types';
import {
  getHiringFunnel,
  isUrgentVacancy,
  vacancyStatusBadge,
} from '@/utils/vacancyManagement';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';

interface VacancyHubListViewProps {
  filteredVacancies: Vacancy[];
  search: string;
  statusFilter: string;
  deptFilter: string;
  hmFilter: string;
  dateFilter: 'all' | 'closing_30' | 'overdue';
  departments: string[];
  hiringManagers: Array<[string, string]>;
  recruitmentRequests: RecruitmentRequest[];
  applications: Application[];
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setDeptFilter: (value: string) => void;
  setHmFilter: (value: string) => void;
  setDateFilter: (value: 'all' | 'closing_30' | 'overdue') => void;
  onSelectVacancyDetail: (id: string) => void;
  onEditVacancy: (id: string) => void;
  onPostVacancy: (id: string) => void;
}

export const VacancyHubListView: React.FC<VacancyHubListViewProps> = ({
  filteredVacancies,
  search,
  statusFilter,
  deptFilter,
  hmFilter,
  dateFilter,
  departments,
  hiringManagers,
  recruitmentRequests,
  applications,
  setSearch,
  setStatusFilter,
  setDeptFilter,
  setHmFilter,
  setDateFilter,
  onSelectVacancyDetail,
  onEditVacancy,
  onPostVacancy,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, deptFilter, hmFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVacancies.length / itemsPerPage);
  const paginatedVacancies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVacancies.slice(startIndex, endIndex);
  }, [filteredVacancies, currentPage, itemsPerPage]);

  const vacancyStatuses: VacancyStatus[] = [
    'draft',
    'open',
    'published',
    'in_progress',
    'on_hold',
    'cancelled',
    'closed',
  ];
   const { can } = usePermissions();
   const canRead = can(PERMISSIONS.VACANCY_READ);
     const canCreate = can(PERMISSIONS.VACANCY_CREATE);
     const canUpdate = can(PERMISSIONS.VACANCY_UPDATE);
     const canPublish = can(PERMISSIONS.VACANCY_PUBLISH);

  const getDisplayHiringManager = (vacancy: Vacancy) => {
    if (vacancy.hiringManagerName && vacancy.hiringManagerName !== 'TBD') {
      return vacancy.hiringManagerName;
    }

    return (
      recruitmentRequests.find((request) => request.id === vacancy.recruitmentRequestId)
        ?.hiringManagerName || 'Unassigned'
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filters Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        {/* Top Row: Search + Actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
              search
            </span>

            <input
              type="search"
              placeholder="Search vacancies, codes, departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Reset (optional but improves UX) */}
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDeptFilter("all");
              setHmFilter("all");
              setDateFilter("all");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
          >
            
            Reset Filters
          </button>
        </div>

        {/* Bottom Row: Filter Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Status</option>
            {vacancyStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Hiring Manager */}
          <select
            value={hmFilter}
            onChange={(e) => setHmFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Managers</option>
            {hiringManagers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(e.target.value as "all" | "closing_30" | "overdue")
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Time</option>
            <option value="closing_30">Closing Soon</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Data Presentation Table Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {!canRead ? (
          <div className="p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-rose-400">lock</span>
            <p className="text-sm font-bold text-rose-700">Access restricted</p>
            <p className="text-xs text-rose-500">You do not have permission to view vacancies.</p>
          </div>
        ) : (
          <>
            <div className="w-full">
              <table className="w-full text-sm table-auto border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b-2 border-indigo-100 uppercase text-[11px] font-extrabold tracking-wider text-slate-500 select-none">
                    <th className="px-5 py-4 text-left w-[14%]">Tracking Code</th>
                    <th className="px-5 py-4 text-left w-[28%]">Vacancy Position</th>
                    <th className="px-5 py-4 text-left w-[20%]">Allocated Department</th>
                    <th className="px-5 py-4 text-left w-[16%]">Hiring Manager</th>
                    <th className="px-5 py-4 text-center w-[12%]">Lifecycle State</th>
                    <th className="px-5 py-4 text-center w-[10%]">Days to Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredVacancies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-medium italic bg-gradient-to-b from-slate-50 to-white">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                          <p>No active recruitment vacancies correspond with your current query parameters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedVacancies.map((vac) => {
                      const funnel = getHiringFunnel(applications, vac.id);
                      const normalizedStatus = String(vac.vacancyStatus ?? '').toLowerCase();
                      const effectiveStatus = (normalizedStatus === 'published' && funnel.total > 0) ? 'in_progress' : normalizedStatus;
                      const badge = vacancyStatusBadge(effectiveStatus as VacancyStatus);
                      const daysRemaining = Math.ceil(
                        (new Date(vac.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      const isOverdue = daysRemaining < 0;

                      return (
                        <tr
                          key={vac.id}
                          className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 cursor-pointer transition-all duration-200 group border-b border-slate-50 last:border-0"
                          onClick={() => onSelectVacancyDetail(vac.id)}
                        >
                          <td className="px-5 py-4 font-mono font-bold text-indigo-600 tracking-tight bg-white/50 group-hover:bg-white transition-colors">
                            {vac.displayCode}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                                {vac.title}
                              </span>
                              {isUrgentVacancy(vac) && (
                                <span className="inline-flex self-start text-[10px] text-red-700 font-extrabold tracking-widest bg-gradient-to-r from-red-50 to-orange-50 px-2 py-1 rounded-full border border-red-200">
                                  URGENT RECRUIT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-medium text-sm">{vac.departmentName}</td>
                          <td className="px-5 py-4 text-slate-600 text-sm">{getDisplayHiringManager(vac)}</td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider ${badge.className} shadow-sm`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className={`px-5 py-4 text-center font-mono font-bold text-sm ${isOverdue || daysRemaining <= 5 ? 'text-red-600' : 'text-slate-500'}`}>
                            {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredVacancies.length)} of {filteredVacancies.length} vacancies
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
          </>
        )}
      </div>
    </div>
  );
};
