import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MyVacancy {
  id: string;
  title: string;
  status: string;
  open_positions: number;
  department: { id: number; name: string };
  applications: { id: string; status: string }[];
}

interface MyVacanciesProps {
  vacancies?: MyVacancy[];
}

/**
 * MyVacancies displays vacancies assigned to the current hiring manager.
 */
export const MyVacancies: React.FC<MyVacanciesProps> = ({ vacancies = [] }) => {
  const navigate = useNavigate();

  if (!vacancies.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="p-6 text-center text-slate-500">
          <span className="material-symbols-outlined text-slate-300 text-4xl block mb-2">
            work_outline
          </span>
          <p className="text-sm">No vacancies assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            My Vacancies
          </h3>
          <p className="text-xs text-slate-400 mt-1">Roles assigned to you.</p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          {vacancies.length}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {vacancies.map((vacancy) => {
          const applicationCount = vacancy.applications?.length || 0;
          const statusUpper = vacancy.status.toUpperCase();
          const statusColor =
            statusUpper === 'PUBLISHED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : statusUpper === 'IN_PROGRESS'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : statusUpper === 'CLOSED'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200';
          return (
            <div
              key={vacancy.id}
              onClick={() => navigate('/dashboard/vacancies')}
              className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {vacancy.title}
                  </h4>
                  <p className="text-xs text-slate-500">{vacancy.department.name}</p>
                </div>
                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                  {vacancy.open_positions} open
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {applicationCount}
                  </span>{' '}
                  applications
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor}`}>
                  {statusUpper}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyVacancies;
