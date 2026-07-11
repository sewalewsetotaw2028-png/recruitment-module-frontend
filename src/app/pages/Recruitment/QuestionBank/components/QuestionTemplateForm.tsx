import React, { useState } from 'react';

interface QuestionTemplateFormProps {
  onSave: (payload: {
    text: string;
    role: string;
    category: string;
  }) => void;
}

export const QuestionTemplateForm: React.FC<QuestionTemplateFormProps> = ({
  onSave,
}) => {
  const [customText, setCustomText] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customCategory, setCustomCategory] = useState('Technical');

  return (
    <aside className="bg-white border border-slate-200 rounded-2xl p-5 h-fit shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900">
          Custom question template
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          FR-36 / FR-74: Save panel questions for reuse across interviews.
        </p>
      </div>
      <div>
        <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
          Question
        </label>
        <textarea
          rows={4}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="e.g. Walk us through your approach to portfolio rebalancing…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
          Target role
        </label>
        <input
          type="text"
          value={customRole}
          onChange={(e) => setCustomRole(e.target.value)}
          placeholder="e.g. Senior Wealth Manager"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
          Category
        </label>
        <select
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
        >
          <option>Technical</option>
          <option>Behavioral</option>
          <option>Leadership</option>
          <option>Culture Fit</option>
        </select>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!customText.trim()) return;
          onSave({
            text: customText.trim(),
            role: customRole.trim(),
            category: customCategory,
          });
          setCustomText('');
        }}
        className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
      >
        Save template
      </button>
    </aside>
  );
};
