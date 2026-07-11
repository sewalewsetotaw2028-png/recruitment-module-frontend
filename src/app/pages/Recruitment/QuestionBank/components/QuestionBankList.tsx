import React from 'react';
import type { QuestionBankItem } from '@/types';

interface QuestionBankListProps {
  questions: QuestionBankItem[];
  onUseQuestion: (questionId: string) => void;
}

export const QuestionBankList: React.FC<QuestionBankListProps> = ({
  questions,
  onUseQuestion,
}) => {
  if (questions.length === 0) {
    return (
      <p className="text-center text-slate-400 p-12 bg-white border border-dashed border-slate-200 rounded-2xl">
        No questions match your filters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <article
          key={q.id}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200 transition-colors"
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              {q.jobRole}
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
              {q.functionalArea}
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-100">
              {q.category}
            </span>
            {q.grade && (
              <span className="text-xs text-slate-400">Grade {q.grade}</span>
            )}
          </div>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {q.questionText}
          </p>
          <button
            type="button"
            onClick={() => onUseQuestion(q.id)}
            className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            Use in interview
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </article>
      ))}
    </div>
  );
};
