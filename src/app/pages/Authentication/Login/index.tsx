import { useAuthenticationLoginSlice } from './slice';
import { authenticationLoginActions } from './slice';
import { selectLoginPageError, selectLoginSubmitting } from './slice/selectors';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useAuthSlice } from '@/slice/authSlice';
import { selectAuthUser } from '@/slice/authSlice/selectors';
import { AuthShell } from '@/components/auth/AuthShell';
import { authService } from '@/services/authService';
import { config } from '@/config/env';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  useAuthenticationLoginSlice();
  useAuthSlice();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applyVacancyId = searchParams.get('apply');
  const user = useAppSelector(selectAuthUser);
  const submitting = useAppSelector(selectLoginSubmitting);
  const pageError = useAppSelector(selectLoginPageError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {

    if (user && user.isEmailVerified !== false) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailNotVerified(false);
    setResendMessage(null);
    dispatch(authenticationLoginActions.submitLogin({ email, password }));
  };

  // After login, check if the user's email is verified
  useEffect(() => {
    if (user && user.isEmailVerified === false) {
      setEmailNotVerified(true);
    }
  }, [user]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      // Determine user type based on the logged-in user's role
      const userType = user?.role === 'candidate' ? 'candidate' : 'user';
      const targetEmail = email || user?.email || '';
      const result = await authService.resendVerification(targetEmail, userType);
      setResendMessage(result.message || 'Verification email resent.');
    } catch (err) {
      setResendMessage(
        err instanceof Error ? err.message : 'Failed to resend verification email.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue managing recruitment workflows."
      footerText="Do not have an account?"
      footerLinkText="Create one"
      footerLinkTo={applyVacancyId ? `/signup?apply=${applyVacancyId}` : '/signup'}
    >
      {/* Email not verified warning banner */}
      {emailNotVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 mb-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium mb-1">Email not verified</p>
              <p className="mb-2">
                Your email has not been verified yet. Please check your inbox
                and click the verification link to unlock all features.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="text-amber-700 font-medium underline hover:text-amber-800 transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
              {resendMessage && (
                <p className="mt-1 text-amber-700">{resendMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {pageError && !emailNotVerified && (
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

        {/* Magic link option */}
        <p className="text-center text-xs text-slate-500 pt-1">
          <Link
            to="/login/magic-link"
            className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-all"
          >
            Sign in with magic link instead
          </Link>
        </p>
      </form>

      {/* Styled Inline Divider */}
      <div className="my-3 flex items-center justify-center relative w-full">
        <div className="w-full border-t border-slate-100" />
        <span className="absolute px-3 bg-white text-xs text-slate-400 font-medium tracking-wide">
          or
        </span>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={() => {
          setGoogleLoading(true);
          window.location.href = `${config.apiUrl}/api/v1/auth/google?redirectUrl=${encodeURIComponent(
            window.location.origin,
          )}`;
        }}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl py-2.5 font-semibold text-sm bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
      >
        {/* Google G Logo SVG */}
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
      </button>
    </AuthShell>
  );
};

export default LoginPage;
