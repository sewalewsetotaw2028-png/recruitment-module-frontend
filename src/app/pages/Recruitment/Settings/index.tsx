import { useRecruitmentSettingsSlice } from './slice';
import React, { useState } from 'react';
import { useApp } from '@/state';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { Link } from 'react-router-dom';

export const HRSettingsPage: React.FC = () => {
  useRecruitmentSettingsSlice();
  const { toast } = useToast();
  const { can } = usePermissions();
  const { hrisIntegrationAvailable, hrisManualMode, setHrisManualModeState } =
    useApp();
  const [settingsTab, setSettingsTab] = useState<'config' | 'notifications'>(
    'config',
  );

  const notificationLog = [
    {
      id: 'n1',
      type: 'Application Received',
      recipient: 'Alexander Sterling',
      email: 'alex@gmail.com',
      channel: 'Email',
      message: 'Your application for Senior Wealth Manager has been received.',
      status: 'Sent',
      timestamp: '2026-05-20 09:14 AM',
    },
    {
      id: 'n2',
      type: 'Shortlist Notification',
      recipient: 'Tigist Alemu',
      email: 'tigist@gmail.com',
      channel: 'Email + SMS',
      message:
        'Congratulations! You have been shortlisted for Compliance Lead.',
      status: 'Sent',
      timestamp: '2026-05-20 11:32 AM',
    },
    {
      id: 'n3',
      type: 'Interview Invitation',
      recipient: 'Alexander Sterling',
      email: 'alex@gmail.com',
      channel: 'Email + In-System',
      message: 'Your interview is scheduled for May 24, 2026 at 10:00 AM.',
      status: 'Sent',
      timestamp: '2026-05-21 08:00 AM',
    },
    {
      id: 'n4',
      type: 'Regret Notification',
      recipient: 'Henok Girma',
      email: 'henok@gmail.com',
      channel: 'Email',
      message:
        'Thank you for applying. After careful review, we regret to inform you...',
      status: 'Sent',
      timestamp: '2026-05-21 02:15 PM',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-sm text-slate-700 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            System Settings & Logs
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Configure recruitment workflows, HRIS integrations, and view
            dispatch history.
          </p>
        </div>

        {/* Toggle Segmented Control */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm text-xs">
          <button
            onClick={() => setSettingsTab('config')}
            className={`px-4 py-1.5 font-semibold rounded-lg transition-all ${
              settingsTab === 'config'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Workflow Config
          </button>
          <button
            onClick={() => setSettingsTab('notifications')}
            className={`px-4 py-1.5 font-semibold rounded-lg transition-all ${
              settingsTab === 'notifications'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Dispatch Audit Log
          </button>
        </div>
      </div>

      {/* Tab Panel Canvas: Config */}
      {settingsTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* HRIS Integration */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-lg">
                sync_alt
              </span>
              HRIS System Link (Odoo/SAP ERP)
            </h3>
            <p className="text-slate-500 leading-relaxed text-xs">
              Define whether approved recruitment requests sync automatically to
              open vacancies or rely on manual dispatching.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-slate-700">
                  Integration status
                </span>
                <span className="px-2.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-[10px] tracking-wide shadow-sm">
                  Connected
                </span>
              </div>

              <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-200/60 group">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 text-xs transition-colors group-hover:text-slate-800">
                    Manual vacancy creation mode
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Require HR confirmation before mapping requisitions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hrisManualMode}
                  onChange={(e) => {
                    setHrisManualModeState(e.target.checked);
                    toast(
                      `Manual vacancy mode: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`,
                    );
                  }}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-500 cursor-pointer accent-slate-900"
                />
              </label>
            </div>
          </div>

          {/* Custom field config */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-lg">
                rule
              </span>
              Candidate Application Fields
            </h3>

            <div className="space-y-2">
              {[
                {
                  field: 'Years of Banking Exp.',
                  module: 'Screening',
                  type: 'Number',
                  required: true,
                },
                {
                  field: 'Background Check Status',
                  module: 'Evaluation Form',
                  type: 'Status',
                  required: true,
                },
                {
                  field: 'Internal Referral Code',
                  module: 'Application',
                  type: 'Text',
                  required: false,
                },
              ].map((f) => (
                <div
                  key={f.field}
                  className="flex justify-between items-center p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm hover:border-slate-300 transition"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 text-xs">
                      {f.field}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {f.module} —{' '}
                      <span className="font-mono text-slate-500">{f.type}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {f.required && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-100">
                        Required
                      </span>
                    )}
                    <button
                      onClick={() => toast(`Editing field: ${f.field}`)}
                      className="p-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
                    >
                      <span className="material-symbols-outlined block text-[16px]">
                        edit
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HR Configuration Hub Link */}
          {can(PERMISSIONS.CONFIG_MANAGE) && (
            <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-lg">
                  settings
                </span>
                HR Configuration Hub
              </h3>
              <p className="text-slate-500 leading-relaxed text-xs">
                Configure approval workflows, job templates, screening criteria, evaluation templates, roles & permissions, and other HR settings.
              </p>

              <div className="pt-2">
                <Link
                  id="go-to-configuration-hub"
                  to="/dashboard/configuration"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm transition"
                >
                  <span className="material-symbols-outlined text-base">
                    dashboard
                  </span>
                  Open Configuration Hub
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel Canvas: Notifications Audit */}
      {settingsTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Dispatched',
                value: `${notificationLog.length}`,
                icon: 'send',
                color: 'bg-slate-50 text-slate-900 border-slate-200',
              },
              {
                label: 'Email Sent',
                value: '3',
                icon: 'email',
                color: 'bg-blue-50/50 text-blue-700 border-blue-100',
              },
              {
                label: 'SMS Sent',
                value: '1',
                icon: 'sms',
                color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-4 shadow-sm flex justify-between items-center bg-white ${s.color.split(' ')[2]}`}
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className="font-black text-2xl tracking-tight text-slate-900">
                    {s.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border ${s.color}`}>
                  <span className="material-symbols-outlined block text-lg">
                    {s.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Log Data Frame */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-4 flex-wrap">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-lg">
                  notifications_active
                </span>
                Notification Dispatch Audit Log
              </h3>
              <button
                onClick={() => toast('Log exported successfully.')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm transition"
              >
                <span className="material-symbols-outlined text-base">
                  download
                </span>{' '}
                Export Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    <th className="px-5 py-3 font-semibold">Event Type</th>
                    <th className="px-5 py-3 font-semibold">Recipient</th>
                    <th className="px-5 py-3 font-semibold">Message Preview</th>
                    <th className="px-5 py-3 font-semibold">Channel</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {notificationLog.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {n.type}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800">
                            {n.recipient}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {n.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-[240px] truncate italic text-slate-500">
                        "{n.message}"
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md shadow-sm">
                          {n.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md shadow-sm">
                          {n.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {n.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRSettingsPage;
