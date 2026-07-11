import React from 'react';
import { Link } from 'react-router-dom';

interface AuthShellProps {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}) => (
  <>
    <main
      className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-12 bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50"
      aria-labelledby="auth-title"
    >
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col transition-all duration-200">
        {/* Brand badge */}
        <img
          src="/adiu-logo.jpg"
          alt="Adiu"
          className="h-9 w-9 mb-4 shadow-md shadow-indigo-100 rounded-xl object-contain"
        />

        <div className="mb-4">
          <h2
            id="auth-title"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Form elements injected by parents */}
        <div className="flex-1">{children}</div>

        <p className="text-center text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 leading-normal">
          {footerText}{' '}
          <Link
            to={footerLinkTo}
            className="font-semibold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-all"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </main>
  </>
);
