import React from 'react';

export interface PageSectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  usePrimaryColor?: boolean;
  actionPosition?: 'right' | 'bottom';
}

/**
 * Matches Workforce Planning / Screening page chrome (slate + indigo).
 */
export const PageSectionHeader: React.FC<PageSectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  usePrimaryColor,
  actionPosition = 'right',
}) => {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl p-6 border shadow-sm ${
        actionPosition === 'right' ? 'md:flex-row md:items-center md:justify-between' : ''
      } ${
        usePrimaryColor 
          ? 'bg-indigo-600 border-indigo-600 text-white' 
          : 'bg-white border-slate-200'
      }`}
    >
      <div>
        <p
          className={`text-[11px] font-bold uppercase tracking-wider ${
            usePrimaryColor ? 'text-white/80' : 'text-indigo-600'
          }`}
        >
          {eyebrow}
        </p>
        <h2
          className={`text-2xl font-bold tracking-tight mt-1 ${
            usePrimaryColor ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-1 text-sm max-w-2xl ${
              usePrimaryColor ? 'text-white/90' : 'text-slate-500'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className={actionPosition === 'bottom' ? 'mt-4 w-full' : ''}>
          {action}
        </div>
      )}
    </div>
  );
};
