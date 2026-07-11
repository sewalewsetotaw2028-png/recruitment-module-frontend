import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PRIMARY_COLOR_HEX } from '@/config/theme';
import type { CandidateDashboardApplication } from '../slice/types';

export const ApplicationsPanel: React.FC<{
  applications?: CandidateDashboardApplication[];
}> = ({ applications = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden text-slate-800 antialiased">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Active Applications
        </h3>
        <button
          type="button"
          onClick={() => navigate('/dashboard/applications')}
          className="text-xs font-bold hover:transition-colors bg-opacity-10 px-2.5 py-1.5 rounded-lg border"
          style={{
            color: PRIMARY_COLOR_HEX,
            borderColor: PRIMARY_COLOR_HEX + '4d',
            backgroundColor: PRIMARY_COLOR_HEX + '1a',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = PRIMARY_COLOR_HEX + '33';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PRIMARY_COLOR_HEX + '1a';
          }}
        >
          View all
        </button>
      </div>

      {/* Row List */}
      <div className="divide-y divide-slate-100">
        {applications.length === 0 ? (
          <div className="px-6 py-12 text-center space-y-2">
            <span className="material-symbols-outlined text-slate-300 text-xl block">
              receipt_long
            </span>
            <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
              No applications yet. Browse open roles to get started.
            </p>
          </div>
        ) : (
          applications.slice(0, 5).map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => navigate('/dashboard/applications')}
              className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/60 transition-all duration-150 group"
            >
              {/* Left-side Icon Grid Box */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 border border-slate-200/60 transition-colors group-hover:!text-white"
                style={{
                  backgroundColor: 'rgb(248 250 252)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = PRIMARY_COLOR_HEX;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(248 250 252)';
                  const icon = e.currentTarget.querySelector('span');
                  if (icon) icon.style.color = 'rgb(100 116 139)';
                }}
              >
                <span
                  className="material-symbols-outlined text-[19px]"
                  style={{ transition: 'color 0.2s' }}
                >
                  work
                </span>
              </div>

              {/* Text Core Elements */}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 group-hover:text-primary truncate text-sm tracking-tight transition-colors">
                  {app.vacancyTitle}
                </p>
                {app.location && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] shrink-0 text-slate-300">
                      location_on
                    </span>
                    <span className="truncate">{app.location}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {app.interviewsCount > 0
                    ? `${app.interviewsCount} interview${app.interviewsCount > 1 ? 's' : ''}`
                    : 'Awaiting interview scheduling'}
                </p>
              </div>

              {/* Badge Layer */}
              <span className="shrink-0 rounded-lg bg-slate-50 border border-slate-200/50 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors font-mono">
                {app.currentStage}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
