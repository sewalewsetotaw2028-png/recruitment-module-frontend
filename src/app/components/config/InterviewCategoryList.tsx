import React, { useMemo, useState } from 'react';
import type { InterviewCategory } from '@/hooks/useInterviewCategories';

interface InterviewCategoryListProps {
  categories: InterviewCategory[];
  selectedCategoryId: string | null;
  loading: boolean;
  onSelect: (category: InterviewCategory) => void;
  onAdd: () => void;
  onEdit: (category: InterviewCategory) => void;
  onDelete: (category: InterviewCategory) => void;
}

export const InterviewCategoryList: React.FC<
  InterviewCategoryListProps
> = ({
  categories,
  selectedCategoryId,
  loading,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        (category.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [categories, searchQuery]);

  return (
    <div className="flex flex-col h-full min-h-0 text-sm">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white select-none shrink-0 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Categories
          </h3>
          <button
            id="add-category-btn"
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              add
            </span>
            New
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 bg-white border border-slate-100 rounded-xl animate-pulse">
              <div className="h-3 bg-slate-200 rounded-md w-2/3" />
              <div className="h-2.5 bg-slate-100 rounded-md w-1/2 mt-2" />
            </div>
          ))
        ) : filteredCategories.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 font-medium italic bg-white border border-slate-100 rounded-xl shadow-xs">
            {searchQuery.trim() ? 'No categories match your search.' : 'No categories found.'}
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isSelected = category.id === selectedCategoryId;
            return (
              <div
                key={category.id}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all cursor-pointer group focus:outline-none rounded-xl border overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(category)}
                  className="flex-1 min-w-0 text-left focus:outline-none overflow-hidden"
                >
                  <div className="min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-extrabold uppercase tracking-wide truncate transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                        {category.name}
                      </span>
                      {category.is_default && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/40 uppercase tracking-wider select-none">
                          Default
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="mt-0.5 block max-w-full truncate text-[11px] font-medium leading-relaxed text-slate-500">
                        {category.description}
                      </p>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      id={`edit-category-${category.id}`}
                      onClick={() => onEdit(category)}
                      className="p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                      title="Edit category"
                    >
                      <span className="material-symbols-outlined text-[15px] block">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      id={`delete-category-${category.id}`}
                      onClick={() => onDelete(category)}
                      className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                      title="Delete category"
                    >
                      <span className="material-symbols-outlined text-[15px] block">
                        delete
                      </span>
                    </button>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] block">
                      category
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InterviewCategoryList;
