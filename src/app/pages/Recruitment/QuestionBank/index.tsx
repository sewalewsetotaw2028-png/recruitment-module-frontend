import { useQuestionBankSlice } from './slice';
import React, { useMemo, useState } from 'react';
import { useApp } from '@/state';
import { useToast } from '@/components/common/Toast';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import { QuestionBankList } from './components/QuestionBankList';
import { QuestionTemplateForm } from './components/QuestionTemplateForm';

export const QuestionBankPage: React.FC = () => {
  useQuestionBankSlice();
  const { questionBank } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const roles = ['all', ...new Set(questionBank.map((q) => q.jobRole))];
  const areas = ['all', ...new Set(questionBank.map((q) => q.functionalArea))];
  const categories = ['all', ...new Set(questionBank.map((q) => q.category))];

  const filtered = useMemo(
    () =>
      questionBank.filter((q) => {
        const qLower = search.toLowerCase();
        const matchSearch =
          !search ||
          q.questionText.toLowerCase().includes(qLower) ||
          q.jobRole.toLowerCase().includes(qLower) ||
          q.functionalArea.toLowerCase().includes(qLower);
        const matchRole = roleFilter === 'all' || q.jobRole === roleFilter;
        const matchArea = areaFilter === 'all' || q.functionalArea === areaFilter;
        const matchCat =
          categoryFilter === 'all' || q.category === categoryFilter;
        return matchSearch && matchRole && matchArea && matchCat;
      }),
    [questionBank, search, roleFilter, areaFilter, categoryFilter],
  );

  const summary = useMemo(
    () => ({
      total: questionBank.length,
      roles: new Set(questionBank.map((q) => q.jobRole)).size,
      areas: new Set(questionBank.map((q) => q.functionalArea)).size,
    }),
    [questionBank],
  );

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setAreaFilter('all');
    setCategoryFilter('all');
  };

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
          Question bank
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Interview question library
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Search standardized questions by role, skill area, and category.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-5 max-w-lg">
          {[
            ['Total', summary.total],
            ['Roles', summary.roles],
            ['Areas', summary.areas],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="text-center bg-slate-50 rounded-xl py-3 border border-slate-100"
            >
              <p className="text-[10px] font-bold uppercase text-slate-400">
                {label}
              </p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <FilterToolbar
        resultCount={filtered.length}
        resultLabel="questions"
        onClear={clearFilters}
        fields={[
          {
            key: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Question text, role, skill…',
            value: search,
            onChange: setSearch,
          },
          {
            key: 'role',
            label: 'Job role',
            type: 'select',
            value: roleFilter,
            onChange: setRoleFilter,
            options: roles.map((r) => ({
              value: r,
              label: r === 'all' ? 'All roles' : r,
            })),
          },
          {
            key: 'area',
            label: 'Functional area',
            type: 'select',
            value: areaFilter,
            onChange: setAreaFilter,
            options: areas.map((a) => ({
              value: a,
              label: a === 'all' ? 'All areas' : a,
            })),
          },
          {
            key: 'cat',
            label: 'Category',
            type: 'select',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: categories.map((c) => ({
              value: c,
              label: c === 'all' ? 'All categories' : c,
            })),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuestionBankList
            questions={filtered}
            onUseQuestion={() =>
              toast(
                'Question ready for interview scheduling.',
                'info',
              )
            }
          />
        </div>
        <QuestionTemplateForm
          onSave={() =>
            toast('Custom question saved to your template library.', 'success')
          }
        />
      </div>
    </section>
  );
};

export default QuestionBankPage;
