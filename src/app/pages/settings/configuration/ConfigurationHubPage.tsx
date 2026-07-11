import React from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';

const configItems = [
  {
    id: 'user-management',
    title: 'User Management',
    description: 'Create internal users, assign roles, and manage access across your organisation.',
    icon: 'group',
    route: '/dashboard/configuration/user-management',
  },
  {
    id: 'roles-permissions',
    title: 'Roles & Permissions',
    description: 'Configure user roles, manage security access matrices, and define system permissions.',
    icon: 'manage_accounts',
    route: '/dashboard/configuration/roles-permissions',
  },
  {
    id: 'approval-workflows',
    title: 'Approval Workflows',
    description: 'Configure multi-stage approval chains for different entity types.',
    icon: 'account_tree',
    route: '/dashboard/configuration/approval-workflows',
  },
  {
    id: 'notification-templates',
    title: 'Notification Templates',
    description: 'Configure email and SMS notification templates for different events.',
    icon: 'mail',
    route: '/dashboard/configuration/notification-templates',
  },
  {
    id: 'screening-criteria',
    title: 'Screening Criteria',
    description: 'Configure screening rules for candidate evaluation.',
    icon: 'rule',
    route: '/dashboard/configuration/screening-criteria',
  },
  {
    id: 'evaluation-templates',
    title: 'Evaluation Templates',
    description: 'Configure interview evaluation criteria and scoring weights.',
    icon: 'fact_check',
    route: '/dashboard/configuration/evaluation-templates',
  },
  {
    id: 'job-templates',
    title: 'Job Templates',
    description: 'Configure reusable job templates for vacancy creation.',
    icon: 'work',
    route: '/dashboard/configuration/job-templates',
  },
  {
    id: 'interview-categories',
    title: 'Interview Categories',
    description: 'Configure interview categories for organizing different types of interviews.',
    icon: 'category',
    route: '/dashboard/configuration/interview-categories',
  },
  {
    id: 'channels-sources',
    title: 'Channels & Sources',
    description: 'Configure recruitment channels and sources for tracking candidate origins.',
    icon: 'campaign',
    route: '/dashboard/configuration/channels-sources',
  },
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    description: 'Configure custom fields for additional data capture on entities.',
    icon: 'data_object',
    route: '/dashboard/configuration/custom-fields',
  },
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'Configure company branding and contact information.',
    icon: 'business',
    route: '/dashboard/configuration/company-profile',
  },
];

export const ConfigurationHubPage: React.FC = () => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto my-12 animate-fade-in text-sm">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-red-500 text-xl">
            lock
          </span>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
            You don't have permission to access configuration settings. Contact your
            HR Administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-5 select-none shrink-0 bg-white">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
          Configuration
        </p>
        <h1 className="text-xl font-extrabold text-slate-800 mt-1 tracking-tight">
          Configuration Hub
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Select a configuration module to manage your HR settings.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {configItems.map((item) => (
            <Link
              key={item.id}
              to={item.route}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    {item.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConfigurationHubPage;
