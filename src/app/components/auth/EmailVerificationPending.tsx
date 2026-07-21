import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { AuthShell } from './AuthShell';

interface EmailVerificationPendingProps {
  email: string;
  userType?: 'user' | 'candidate';
}

/**
 * Displayed after a user registers but before they verify their email.
 * Shows the verification status, a resend button with cooldown, and
 * a link to check their inbox.
 */
export const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({
  email,
  userType = 'user',
}) => {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer (60 seconds)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendMessage(null);
    setResendError(null);
    try {
      const result = await authService.resendVerification(email, userType);
      setResendMessage(result.message || 'Verification email resent. Please check your inbox.');
      setCooldown(60);
    } catch (err) {
      setResendError(
        err instanceof Error ? err.message : 'Failed to resend verification email.',
      );
    } finally {
      setResending(false);
    }
  }, [email, userType, resending, cooldown]);

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Almost there! We just need to confirm your email address."
      footerText="Already verified?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      <div className="flex flex-col items-center text-center py-4">
        {/* Mail icon */}
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <p className="text-sm text-slate-600 mb-2 leading-relaxed">
          We sent a verification email to{' '}
          <strong className="text-slate-800">{email}</strong>
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Click the link in the email to verify your account and access all features.
        </p>

        {/* Resend button with cooldown */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {resending
            ? 'Sending...'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend verification email'}
        </button>

        {resendMessage && (
          <div className="mt-3 w-full rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-800 animate-fade-in">
            {resendMessage}
          </div>
        )}

        {resendError && (
          <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 animate-fade-in">
            {resendError}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-6">
          Didn't receive the email? Check your spam folder or try a different email address.
        </p>
      </div>
    </AuthShell>
  );
};

export default EmailVerificationPending;
