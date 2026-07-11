import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CompletenessSection {
  key: string;
  label: string;
  path: string;
  complete: boolean;
  optional?: boolean;
}

interface CompletenessData {
  percentage?: number;
  sections?: CompletenessSection[];
}

export const ProfileCompletenessCard: React.FC<{ completeness?: CompletenessData | null }> = ({
  completeness,
}) => {
  const navigate = useNavigate();
  if (!completeness || !Array.isArray(completeness.sections)) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary/70">
          Profile completeness
        </p>
        <span className="text-sm font-mono font-bold bg-primary/20 px-2 py-0.5 rounded text-primary">
          {completeness.percentage ?? 0}%
        </span>
      </div>
      <p className="text-lg font-bold mt-2">Stay recruitment-ready</p>
      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
        Verified documents and work history help recruiters move you through screening faster.
      </p>
      <ul className="mt-4 space-y-2 text-xs">
        {completeness.sections.map((section) => (
          <li key={section.key} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-base shrink-0 ${
                  section.complete ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {section.complete ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={section.complete ? 'text-slate-300' : 'text-slate-400'}>
                {section.label}
              </span>
            </div>
            {!section.complete && (
              <button
                type="button"
                onClick={() => navigate(section.path)}
                className="text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer"
              >
                Add
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileCompletenessCard;
