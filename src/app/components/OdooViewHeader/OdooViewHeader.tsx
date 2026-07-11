import React from 'react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface OdooViewHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export const OdooViewHeader: React.FC<OdooViewHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
}) => {
  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-outline-variant">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {subtitle && (
            <p className="text-base text-on-surface-variant mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center">{actions}</div>}
      </div>
    </div>
  );
};

export default OdooViewHeader;
