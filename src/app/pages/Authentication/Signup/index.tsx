import { useAuthenticationSignupSlice } from './slice';
import { authenticationSignupActions } from './slice';
import {
  selectSignupPageError,
  selectSignupSubmitting,
} from './slice/selectors';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useAuthSlice } from '@/slice/authSlice';
import { selectAuthUser } from '@/slice/authSlice/selectors';
import { AuthShell } from '@/components/auth/AuthShell';
import { config } from '@/config/env';

export const SignupPage: React.FC = () => {
  const dispatch = useAppDispatch();
  useAuthenticationSignupSlice();
  useAuthSlice();

  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);
  const submitting = useAppSelector(selectSignupSubmitting);
  const pageError = useAppSelector(selectSignupPageError);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [navigate, user]);

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

      {/* Styled OAuth Identity Provider Button */}
      <button
        type="button"
        onClick={() => {
          window.location.href = `${config.apiUrl}/api/v1/auth/google?redirectUrl=${encodeURIComponent(
            window.location.origin,
          )}`;
        }}
        className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 font-semibold text-sm bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:bg-slate-100 shadow-2xs"
      >
        Continue with Google
      </button>
    </AuthShell>
  );
};

export default SignupPage;
