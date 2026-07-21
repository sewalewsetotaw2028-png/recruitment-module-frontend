import { useAuthenticationSignupSlice } from './slice';
import { authenticationSignupActions } from './slice';
import {
  selectSignupPageError,
  selectSignupSubmitting,
  selectSignupSuccess,
} from './slice/selectors';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useAuthSlice } from '@/slice/authSlice';
import { selectAuthUser } from '@/slice/authSlice/selectors';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmailVerificationPending } from '@/components/auth/EmailVerificationPending';
import { config } from '@/config/env';

export const SignupPage: React.FC = () => {
  const dispatch = useAppDispatch();
  useAuthenticationSignupSlice();
  useAuthSlice();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applyVacancyId = searchParams.get('apply');
  const user = useAppSelector(selectAuthUser);
  const submitting = useAppSelector(selectSignupSubmitting);
  const pageError = useAppSelector(selectSignupPageError);
  const signupSuccess = useAppSelector(selectSignupSuccess);

  // Track registration success to show verification pending view
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (applyVacancyId) {
        // Signed up and have vacancy to apply — go straight to job search page
        navigate(`/dashboard/candidate/job-search?apply=${applyVacancyId}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate, user, applyVacancyId]);

  // Reset signupSuccess when navigating away or re-opening the form
  useEffect(() => {
    return () => {
      dispatch(authenticationSignupActions.reset());
    };
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setPasswordError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate terms accepted
    if (!termsAccepted) {
      setPasswordError('You must accept the terms and conditions');
      return;
    }

    setRegisteredEmail(email);
    dispatch(
      authenticationSignupActions.submitSignup({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        termsAccepted,
      }),
    );
  };

  // Show verification pending view after successful registration
  if (signupSuccess && registeredEmail) {
    return (
      <EmailVerificationPending email={registeredEmail} userType="user" />
    );
  }

  return (
    <AuthShell
      title="Create candidate account"
      subtitle="Sign up to start managing applications and your talent profile."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 mb-3 animate-fade-in">
          {pageError}
        </div>
      )}

      {passwordError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 mb-3 animate-fade-in">
          {passwordError}
        </div>
      )}

      {applyVacancyId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 mb-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-sm shrink-0">work</span>
          <span>
            <strong>You're applying for a job!</strong> Create your candidate account below, then complete your profile and submit your application.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Side-by-side Layout Grid for First/Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">
              First name
            </span>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-2xs"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              placeholder="John"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">
              Last name
            </span>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-2xs"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              placeholder="Doe"
            />
          </div>
        </div>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">
            Confirm Password
          </span>
          <input
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-2xs"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        </div>

        {/* Clean Flexbox Layout for the Terms Checkbox Wrapper */}
        <label className="flex items-start gap-2 pt-1 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer accent-indigo-600 transition-all"
          />
          <span className="text-xs text-slate-500 leading-normal group-hover:text-slate-600 transition-colors">
            I agree to the{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2 decoration-indigo-200"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2 decoration-indigo-200"
            >
              Privacy Policy
            </a>
          </span>
        </label>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all mt-2"
          disabled={submitting}
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Structured Mid-Row Divider Line */}
      <div className="my-5 flex items-center justify-center relative w-full">
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

export default SignupPage;
