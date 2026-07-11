import React from 'react';
import type { WorkforcePlan } from '@/types';

interface WorkforcePlanTableProps {
  plans: WorkforcePlan[];
  selectedPlanId: string | null;
  onRowSelect: (id: string) => void;
}

export const WorkforcePlanTable: React.FC<WorkforcePlanTableProps> = ({
  plans,
  selectedPlanId,
  onRowSelect,
}) => {
  // Helper function to render clean, customized status badges
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'under_hr_review':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'under_ceo_review':
      case 'pending_ceo': // legacy alias
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'returned_for_revision':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'closed':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="overflow-x-auto w-full rounded-xl">
      <table className="w-full text-left border-collapse text-sm text-slate-700">
        <thead className="bg-slate-50/70 border-b border-slate-200">
          <tr className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            <th className="p-4 font-semibold">Plan Title</th>
            <th className="p-4 font-semibold">Department</th>
            <th className="p-4 font-semibold">Period</th>
            <th className="p-4 font-semibold">Headcount</th>
            <th className="p-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {plans.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                No workforce plans found matching criteria.
              </td>
            </tr>
          ) : (
            plans.map((plan) => (
              <tr
                key={plan.id}
                className={`cursor-pointer transition-colors duration-150 ${
                  selectedPlanId === plan.id
                    ? 'bg-indigo-50/40 hover:bg-indigo-50/60'
                    : 'hover:bg-slate-50/80'
                }`}
                onClick={() => onRowSelect(plan.id)}
              >
                <td className="p-4 font-semibold text-slate-900 max-w-xs truncate">
                  {plan.title}
                </td>
                <td className="p-4 text-slate-600 font-medium">
                  {plan.departmentName}
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {plan.planningPeriod}{' '}
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1 font-medium lowercase">
                    {plan.planningType}
                  </span>
                </td>
                <td className="p-4 font-bold text-slate-800">
                  {plan.items.reduce(
                    (tot, item) => tot + item.headcountRequired,
                    0,
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusStyles(plan.status)}`}
                  >
                    {plan.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
