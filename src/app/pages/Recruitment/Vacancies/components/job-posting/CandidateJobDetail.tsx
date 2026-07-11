import React, { useEffect, useMemo } from 'react';

import type { JobPosting, Vacancy } from '@/types';

import {

  daysUntilClosing,

  formatEmploymentType,

  linesToListItems,

} from '@/utils/jobPosting';



interface CandidateJobDetailProps {

  vacancy: Vacancy;

  posting?: JobPosting;

  isSaved: boolean;

  isInternal?: boolean;

  onApply: () => void;

  onShare: () => void;

  onToggleSave: () => void;

  onBack: () => void;

  onViewRecorded: () => void;

}



export const CandidateJobDetail: React.FC<CandidateJobDetailProps> = ({

  vacancy,

  posting,

  isSaved,

  isInternal = false,

  onApply,

  onShare,

  onToggleSave,

  onBack,

  onViewRecorded,

}) => {

  useEffect(() => {

    onViewRecorded();

  }, [vacancy.id, onViewRecorded]);



  const daysLeft = useMemo(

    () => daysUntilClosing(posting?.closingDate || vacancy.closingDate),

    [posting?.closingDate, vacancy.closingDate],

  );



  return (

    <div className="max-w-5xl mx-auto space-y-0 pb-24 text-xs animate-fadeIn px-4 sm:px-6 lg:px-0">

      {/* Corporate branding header — FR-21 */}

      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl mb-8 relative">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]"></div>

        <div className="p-6 md:p-10 relative z-10">



          <div className="flex items-center gap-4 mb-6">

            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-sm tracking-wider text-white shadow-md">

              CB

            </div>

            <div>

              <p className="text-[11px] uppercase font-black tracking-widest text-indigo-300 drop-shadow-sm">

                Capital Bank

              </p>

              <p className="text-sm text-slate-100 font-semibold">

                {isInternal ? 'Internal Mobility Portal' : 'Global Careers'}

              </p>

            </div>

          </div>



          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm">

            {vacancy.departmentName}

          </span>



          <h1 className="text-2xl md:text-4xl font-black mt-4 tracking-tight leading-tight max-w-3xl text-white drop-shadow-sm">

            {vacancy.title}

          </h1>



          <div className="flex flex-wrap gap-5 mt-6 text-sm text-white font-semibold border-t border-white/20 pt-5">

            <span className="flex items-center gap-1.5">

              <span className="material-symbols-outlined text-[18px] text-indigo-300 font-bold">

                location_on

              </span>

              {vacancy.location}

            </span>

            <span className="flex items-center gap-1.5">

              <span className="material-symbols-outlined text-[18px] text-indigo-300 font-bold">

                schedule

              </span>

              {formatEmploymentType(vacancy.employmentType)}

            </span>

            {vacancy.salaryMin != null && (

              <span className="flex items-center gap-1.5">

                <span className="material-symbols-outlined text-[18px] text-indigo-300 font-bold">

                  payments

                </span>

                {vacancy.salaryMin.toLocaleString()} –{' '}

                {vacancy.salaryMax?.toLocaleString()} ETB

              </span>

            )}

          </div>

        </div>

      </div>



      {/* Floating Action Bar (Desktop Placement) */}

      <div className="flex flex-col md:flex-row justify-end gap-3 -mt-12 mb-8 relative z-20 md:pr-6">

        <div className="hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50">

          <button

            type="button"

            onClick={onShare}

            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-sm"

            title="Share job"

          >

            <span className="material-symbols-outlined text-[20px]">share</span>

          </button>

          <button

            type="button"

            onClick={onToggleSave}

            className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all active:scale-95 shadow-sm ${isSaved ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}

            title="Save job"

          >

            <span

              className="material-symbols-outlined text-[20px]"

              style={{

                fontVariationSettings: isSaved ? "'FILL' 1" : undefined,

              }}

            >

              {isSaved ? 'bookmark' : 'bookmark_border'}

            </span>

          </button>

          <button

            type="button"

            onClick={onApply}

            className="bg-indigo-700 text-white! px-8 h-10 rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-800 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 tracking-wide uppercase text-[11px]"

          >

            Apply Now

          </button>

        </div>

      </div>



      {/* Grid Content Layout */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

        {/* Left Hand Sidebar Metadata */}

        <aside className="lg:col-span-4 space-y-6 order-2 lg:order-1">

          {daysLeft !== null && (

            <div className="bg-amber-50/60 border border-amber-200/70 p-6 rounded-2xl shadow-sm relative overflow-hidden">

              <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-[0.04] text-amber-900 pointer-events-none">

                <span className="material-symbols-outlined text-[120px]">

                  event

                </span>

              </div>

              <h3 className="font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2 text-[10px]">

                <span className="material-symbols-outlined text-[18px]">

                  event

                </span>

                Application Deadline

              </h3>

              <div className="text-amber-900 text-4xl font-black tracking-tight flex items-baseline gap-1 leading-none">

                {daysLeft}

                <span className="text-xs font-bold text-amber-700 tracking-normal uppercase">

                  days left

                </span>

              </div>

              <p className="text-[11px] text-amber-700 mt-4 font-semibold border-t border-amber-200/50 pt-3">

                Closes{' '}

                {new Date(

                  posting?.closingDate || vacancy.closingDate || '',

                ).toLocaleDateString()}

              </p>

            </div>

          )}



          {vacancy.experienceRequired && (

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-1">

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">

                Experience Required

              </h3>

              <p className="font-extrabold text-slate-900 text-sm">

                {vacancy.experienceRequired}

              </p>

            </div>

          )}



          {vacancy.hiringManagerName && (

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-1">

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">

                Hiring Team

              </h3>

              <p className="font-extrabold text-indigo-600 text-sm">

                {vacancy.hiringManagerName}

              </p>

              <p className="text-[11px] font-medium text-slate-400">

                Talent Acquisition Board

              </p>

            </div>

          )}

        </aside>



        {/* Right Hand Primary Article Vectors */}

        <article className="lg:col-span-8 order-1 lg:order-2 space-y-6">

          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">

            <h2 className="text-sm font-black text-slate-900 border-l-4 border-indigo-600 pl-3 mb-4 uppercase tracking-wider">

              Role Summary

            </h2>

            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm font-medium">

              {vacancy.description}

            </p>

          </section>



          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">

            <h2 className="text-sm font-black text-slate-900 border-l-4 border-indigo-600 pl-3 mb-4 uppercase tracking-wider">

              Responsibilities

            </h2>

            <ul className="list-none space-y-3 text-slate-600 text-sm font-medium">

              {linesToListItems(vacancy.responsibilities).map((line, i) => (

                <li key={i} className="flex items-start gap-3">

                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>

                  <span>{line}</span>

                </li>

              ))}

            </ul>

          </section>



          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">

            <h2 className="text-sm font-black text-slate-900 border-l-4 border-indigo-600 pl-3 mb-4 uppercase tracking-wider">

              Qualifications & Competencies

            </h2>

            <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm font-medium">

              {vacancy.requirements}

            </p>

            {vacancy.skills?.length > 0 && (

              <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-4">

                {vacancy.skills.map((s) => (

                  <span

                    key={s}

                    className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold tracking-wide"

                  >

                    {s}

                  </span>

                ))}

              </div>

            )}

          </section>



          {vacancy.benefits && (

            <section className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">

              <h2 className="text-sm font-black text-slate-900 border-l-4 border-indigo-600 pl-3 mb-4 uppercase tracking-wider">

                Benefits & Perks

              </h2>

              <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm font-medium">

                {vacancy.benefits}

              </p>

            </section>

          )}



          {vacancy.employmentTerms && (

            <section className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">

              <h2 className="text-sm font-black text-slate-900 border-l-4 border-indigo-600 pl-3 mb-4 uppercase tracking-wider">

                Employment Terms

              </h2>

              <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm font-medium">

                {vacancy.employmentTerms}

              </p>

            </section>

          )}

        </article>

      </div>



      {/* Mobile Sticky Footer Layout */}

      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-xl p-4 flex items-center gap-3 z-40">

        <button

          type="button"

          onClick={onApply}

          className="flex-1 bg-indigo-600 text-white h-12 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-indigo-600/15"

        >

          Apply Now

        </button>

        <button

          type="button"

          onClick={onShare}

          className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-600 active:bg-slate-50"

        >

          <span className="material-symbols-outlined">share</span>

        </button>

        <button

          type="button"

          onClick={onToggleSave}

          className={`w-12 h-12 flex items-center justify-center border rounded-xl active:bg-slate-50 ${isSaved ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}

        >

          <span

            className="material-symbols-outlined"

            style={{ fontVariationSettings: isSaved ? "'FILL' 1" : undefined }}

          >

            {isSaved ? 'bookmark' : 'bookmark_border'}

          </span>

        </button>

      </div>

    </div>

  );

};

