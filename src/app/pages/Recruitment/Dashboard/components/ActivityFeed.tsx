import React from 'react';
import { useAppSelector } from '@/hooks';
import { selectRecruitmentDashboardSummary } from '@/pages/Recruitment/Dashboard/slice/selectors';

interface ActivityItem {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

/**
 * Derives a short list of recent activity highlights from the live dashboard
 * summary rather than rendering hardcoded static entries.
 */
const buildActivities = (summary?: {
  totalVacancies?: number;
  openVacancies?: number;
  totalApplications?: number;
  hiredCount?: number;
  fulfillmentRate?: string;
}): ActivityItem[] => {
  if (!summary) return [];
  const items: ActivityItem[] = [];

  if (summary.hiredCount != null && summary.hiredCount > 0) {
    items.push({
      icon: 'verified',
      iconBg: 'bg-primary-container',
      iconColor: 'text-primary',
      title: `${summary.hiredCount} hire${summary.hiredCount === 1 ? '' : 's'} confirmed`,
      description: 'Offer accepted and onboarding triggered for selected candidates.',
    });
  }

  if (summary.totalApplications != null && summary.totalApplications > 0) {
    items.push({
      icon: 'person_add',
      iconBg: 'bg-tertiary-container',
      iconColor: 'text-tertiary',
      title: `${summary.totalApplications} application${summary.totalApplications === 1 ? '' : 's'} in pipeline`,
      description: 'Active candidates progressing through recruitment stages.',
    });
  }

  if (summary.openVacancies != null && summary.openVacancies > 0) {
    items.push({
      icon: 'work_outline',
      iconBg: 'bg-secondary-container',
      iconColor: 'text-secondary',
      title: `${summary.openVacancies} open vacanc${summary.openVacancies === 1 ? 'y' : 'ies'} active`,
      description: `${summary.fulfillmentRate ?? '--'} of approved vacancies filled this period.`,
    });
  }

  return items;
};

export const ActivityFeed: React.FC = () => {
  const summary = useAppSelector(selectRecruitmentDashboardSummary);
  const activities = buildActivities(summary);

  return (
    <div className="lg:col-span-5 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b border-outline-variant bg-surface-container-low">
        <h3 className="text-base font-semibold text-primary">
          HR Activity Feed
        </h3>
      </div>
      <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar text-xs">
        {activities.length > 0 ? (
          activities.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div
                className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center ${item.iconColor} shrink-0`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">
                  {item.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px] mb-2 opacity-40">
              timeline
            </span>
            <p className="text-xs">Activity will appear once data loads.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
