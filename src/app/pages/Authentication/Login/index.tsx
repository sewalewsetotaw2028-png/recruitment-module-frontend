import { useAuthenticationLoginSlice } from './slice';
import { authenticationLoginActions } from './slice';
import { selectLoginPageError, selectLoginSubmitting } from './slice/selectors';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useAuthSlice } from '@/slice/authSlice';
import { selectIsAuthenticated } from '@/slice/authSlice/selectors';
import { AuthShell } from '@/components/auth/AuthShell';
import { config } from '@/config/env';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  useAuthenticationLoginSlice();
  useAuthSlice();

  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const submitting = useAppSelector(selectLoginSubmitting);
  const pageError = useAppSelector(selectLoginPageError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [navigate, isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(authenticationLoginActions.submitLogin({ email, password }));
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue managing recruitment workflows."
      footerText="Do not have an account?"
      footerLinkText="Create one"
      footerLinkTo="/signup"
    >
      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 mb-3 animate-fade-in">
          {pageError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">
            Email address
          </span>
          <input
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-2xs"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Password</span>
          <input
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-2xs"
            type="password"
            required
            value={password}
            onChange={(e) =>
              e.target.value !== undefined && setPassword(e.target.value)
            }
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white! font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all mt-1"
          disabled={submitting}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Styled Inline Divider */}
      <div className="my-3 flex items-center justify-center relative w-full">
        <div className="w-full border-t border-slate-100" />
        <span className="absolute px-3 bg-white text-xs text-slate-400 font-medium tracking-wide">
          or
        </span>
      </div>

      {/* OAuth Integration Row */}
      <button
        type="button"
        onClick={() => {
          window.location.href = `${config.apiUrl}/api/v1/auth/google?redirectUrl=${encodeURIComponent(
            window.location.origin,
          )}`;
        }}
        className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 font-semibold text-sm bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:bg-slate-100 shadow-2xs"
      >
        {/* Optional SVG Icon container can go here if needed */}
        Continue with Google
      </button>
    </AuthShell>
  );
};

export default LoginPage;
