import { useOffersSlice } from './slice';
import React, { useState } from 'react';
import { useApp } from '@/state';
import { useToast } from '@/components/common/Toast';
import { OdooViewHeader } from '@/components/OdooViewHeader/OdooViewHeader';
import {
  OFFER_TRANSITION_STEPS,
  getOfferTransitionStep,
  hrisSyncBadge,
  offerStatusBadge,
} from '@/utils/offerManagement';
import type { OfferFormPayload, OfferStatus } from '@/types';

export const OfferListPage: React.FC = () => {
  useOffersSlice();
  const {
    jobOffers,
    offerTemplates,
    applications,
    vacancies,
    hrisIntegrationAvailable,
    setHrisManualMode,
    createOfferFromApplication,
    sendOffer,
    withdrawOffer,
    reviseOffer,
    submitOfferForApproval,
    syncOfferToHris,
    initiateOnboarding,
    acceptJobOffer,
  } = useApp();
  const { toast } = useToast();

  const [view, setView] = useState<'dashboard' | 'create' | 'detail'>(
    'dashboard',
  );
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [createAppId, setCreateAppId] = useState('');
  const [form, setForm] = useState<Partial<OfferFormPayload>>({
    salary: 50000,
    employmentType: 'full_time',
    startDate: '2026-07-01',
    expirationDate: '2026-06-30',
    benefits: '',
    templateId: '',
  });

  const selectedOffer = jobOffers.find((o) => o.id === selectedOfferId);
  const offeredApps = applications.filter(
    (a) =>
      a.applicationStatus === 'offered' &&
      !jobOffers.some((o) => o.applicationId === a.id),
  );

  const filtered = jobOffers.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.candidateName.toLowerCase().includes(q) ||
      o.displayCode.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetail = (id: string) => {
    setSelectedOfferId(id);
    setView('detail');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAppId || !form.salary || !form.startDate || !form.expirationDate)
      return;
    const id = createOfferFromApplication({
      applicationId: createAppId,
      salary: form.salary!,
      employmentType: form.employmentType || 'full_time',
      startDate: form.startDate!,
      expirationDate: form.expirationDate!,
      benefits: form.benefits,
      templateId: form.templateId || undefined,
    });
    if (id) {
      openDetail(id);
      setCreateAppId('');
      toast('Offer draft created.', 'success');
    }
  };

  if (view === 'detail' && selectedOffer) {
    const step = getOfferTransitionStep(selectedOffer);
    const hrisBadge = hrisSyncBadge(selectedOffer.hrisSyncStatus);
    const badge = offerStatusBadge(selectedOffer.status);
    const vac = vacancies.find((v) => v.id === selectedOffer.vacancyId);

    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 p-6 bg-slate-50/50 rounded-3xl min-h-screen text-xs animate-fadeIn">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] text-slate-500 border-b border-slate-200 pb-4 font-bold tracking-wide uppercase">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="hover:text-indigo-600 transition-colors"
          >
            Offers & Onboarding Dashboard
          </button>
          <span className="material-symbols-outlined text-[14px] text-slate-400">
            chevron_right
          </span>
          <span className="text-indigo-600 font-extrabold font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            {selectedOffer.displayCode}
          </span>
        </nav>

        {/* Transition flow */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Candidate Hiring Transition
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {OFFER_TRANSITION_STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`text-center p-3 rounded-xl min-w-[110px] flex-1 max-w-[160px] border transition-all duration-300 ${
                  i <= step
                    ? 'bg-indigo-50/60 border-indigo-500 shadow-sm shadow-indigo-500/5'
                    : 'bg-slate-50/50 border-slate-200/60 opacity-50'
                }`}
              >
                <p
                  className={`text-[10px] font-bold leading-snug ${i <= step ? 'text-indigo-700' : 'text-slate-500'}`}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5 mb-2 border-b border-slate-100 pb-4">
                <span className="font-mono font-black text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {selectedOffer.displayCode}
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${badge.className}`}
                >
                  {badge.label}
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider border ${hrisBadge.className}`}
                >
                  {hrisBadge.label}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {selectedOffer.candidateName}
                </h2>
                <p className="text-slate-500 text-xs font-semibold mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    badge
                  </span>
                  {selectedOffer.positionTitle}{' '}
                  <span className="text-slate-300">•</span>{' '}
                  {selectedOffer.departmentName}
                </p>
              </div>

              {/* Information Grid Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-2">
                {[
                  [
                    'Salary',
                    `${selectedOffer.salary.toLocaleString()} ${selectedOffer.salaryCurrency}`,
                    'payments',
                  ],
                  [
                    'Employment',
                    selectedOffer.employmentType.replace('_', ' '),
                    'business_center',
                  ],
                  ['Start Date', selectedOffer.startDate, 'calendar_today'],
                  ['Expires', selectedOffer.expirationDate, 'event_busy'],
                  [
                    'Onboarding',
                    selectedOffer.onboardingStatus.replace('_', ' '),
                    'assignment_ind',
                  ],
                ].map(([k, v, icon]) => (
                  <div
                    key={k}
                    className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 shadow-inner group hover:bg-white transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {k}
                      </p>
                      <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-indigo-500 transition-colors">
                        {icon}
                      </span>
                    </div>
                    <p className="font-extrabold text-slate-900 capitalize text-sm">
                      {v}
                    </p>
                  </div>
                ))}
              </div>

              {/* Workflow Action Terminal */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                {selectedOffer.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => {
                      submitOfferForApproval(selectedOffer.id);
                      toast('Offer submitted for approvals.', 'success');
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    Submit for Approval
                  </button>
                )}
                {['draft', 'pending_approval'].includes(
                  selectedOffer.status,
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      sendOffer(selectedOffer.id);
                      toast('Offer letter dispatched to candidate.', 'success');
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    Send Offer Letter
                  </button>
                )}
                {selectedOffer.status === 'sent' && (
                  <button
                    type="button"
                    onClick={() => {
                      acceptJobOffer(selectedOffer.id);
                      toast('Offer accepted by applicant.', 'success');
                    }}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    Simulate Acceptance
                  </button>
                )}
                {selectedOffer.status === 'accepted' &&
                  selectedOffer.hrisSyncStatus !== 'synced' && (
                    <button
                      type="button"
                      onClick={() => {
                        syncOfferToHris(selectedOffer.id);
                        toast('Syncing records to Odoo HRIS.', 'success');
                      }}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      Transfer to HRIS
                    </button>
                  )}
                {selectedOffer.status === 'accepted' &&
                  selectedOffer.onboardingStatus === 'not_started' && (
                    <button
                      type="button"
                      onClick={() => {
                        initiateOnboarding(selectedOffer.id);
                        toast(
                          'Employee onboarding checklist launched.',
                          'success',
                        );
                      }}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      Initiate Onboarding
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => {
                    withdrawOffer(selectedOffer.id);
                    toast('Offer letter has been withdrawn.', 'info');
                    setView('dashboard');
                  }}
                  className="px-5 py-2.5 border border-rose-200 text-rose-600 bg-white rounded-xl font-bold hover:bg-rose-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                >
                  Withdraw Offer
                </button>
              </div>
            </div>

            {/* Onboarding Checklist */}
            {(selectedOffer.onboardingStatus === 'in_progress' ||
              selectedOffer.onboardingStatus === 'completed') && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4 shadow-sm">
                <h4 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-indigo-600">
                    fact_check
                  </span>
                  Onboarding Progress Checklist
                </h4>
                <ul className="space-y-3 text-xs">
                  {[
                    'Employee ERP Profile Synced',
                    'IT Hardware Provisioning Completed',
                    'Signed Employment Contract Collected',
                    'Background Compliance Checks Passed',
                  ].map((task, i) => (
                    <li
                      key={task}
                      className="flex items-center gap-3 p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl font-medium text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[18px] text-emerald-500 fill-emerald-500/10 shrink-0">
                        check_circle
                      </span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar Audit Records */}
          <div className="lg:col-span-4 space-y-6 text-xs">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="font-extrabold text-slate-900 tracking-tight text-sm uppercase text-[11px] text-slate-400 tracking-widest">
                ERP Sync Logs
              </h4>
              {hrisIntegrationAvailable ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    link
                  </span>{' '}
                  CBE-HRIS Connected
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 font-bold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    link_off
                  </span>
                  HRIS Link Offline (Manual Mode)
                </div>
              )}
              {selectedOffer.hrisEmployeeId && (
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <strong className="text-slate-500">ERP Employee ID:</strong>{' '}
                  <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200/40">
                    {selectedOffer.hrisEmployeeId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="space-y-6 max-w-xl mx-auto p-6 text-xs animate-fadeIn min-h-screen flex flex-col justify-center">
        <button
          type="button"
          onClick={() => setView('dashboard')}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 self-start"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Back to Offer Dashboard
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Generate Employee Offer Letter
          </h2>
          <p className="text-xs font-medium text-slate-400">
            Create a secure recruitment dispatch payload.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-5 shadow-xl"
        >
          <label className="block space-y-1.5">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-wider">
              Candidate / Application *
            </span>
            <div className="relative">
              <select
                required
                value={createAppId}
                onChange={(e) => setCreateAppId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800 appearance-none cursor-pointer"
              >
                <option value="">Select Candidate…</option>
                {offeredApps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.candidateName} — {a.vacancyTitle}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                unfold_more
              </span>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-wider">
              Salary (ETB) *
            </span>
            <input
              type="number"
              required
              value={form.salary}
              onChange={(e) =>
                setForm((f) => ({ ...f, salary: Number(e.target.value) }))
              }
              className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-wider">
              Employment Type *
            </span>
            <div className="relative">
              <select
                value={form.employmentType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    employmentType: e.target.value as any,
                  }))
                }
                className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800 appearance-none cursor-pointer"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contractor">Contractor</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                unfold_more
              </span>
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-wider text-xs mt-2"
          >
            Generate Offer Draft
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 bg-slate-50/50 rounded-3xl min-h-screen text-xs animate-fadeIn">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            placeholder="Search offers by candidate or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl bg-slate-50/50 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
        </div>

        <button
          type="button"
          onClick={() => setView('create')}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Generate Offer
        </button>
      </div>

      {/* Primary Offer Stack Ledger */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black tracking-wider">
              <th className="p-4">Code</th>
              <th className="p-4">Candidate</th>
              <th className="p-4">Position</th>
              <th className="p-4">Salary</th>
              <th className="p-4">Status</th>
              <th className="p-4">Onboarding</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filtered.map((o) => {
              const badge = offerStatusBadge(o.status);
              return (
                <tr
                  key={o.id}
                  className="group cursor-pointer hover:bg-indigo-50/20 transition-colors"
                  onClick={() => openDetail(o.id)}
                >
                  <td className="p-4 font-mono font-black text-indigo-600">
                    {o.displayCode}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {o.candidateName}
                  </td>
                  <td className="p-4 text-slate-500">{o.positionTitle}</td>
                  <td className="p-4 font-semibold text-slate-800">
                    {o.salary.toLocaleString()} ETB
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-4 capitalize text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${o.onboardingStatus === 'completed' ? 'bg-emerald-500' : o.onboardingStatus === 'in_progress' ? 'bg-amber-500' : 'bg-slate-300'}`}
                      ></span>
                      {o.onboardingStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td
                    className="p-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1 ml-auto group-hover:translate-x-[-2px] transition-transform duration-200"
                      onClick={() => openDetail(o.id)}
                    >
                      Open
                      <span className="material-symbols-outlined text-[14px]">
                        arrow_right_alt
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-12 text-center text-slate-400 italic font-medium"
                >
                  No matching offer sheets or deployment vectors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfferListPage;
