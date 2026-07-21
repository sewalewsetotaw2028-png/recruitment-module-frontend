import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks';
import { selectAuthUser } from '@/slice/authSlice/selectors';
import { authService } from '@/services/authService';

const DISMISS_STORAGE_KEY = 'email_verification_banner_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Persistent banner displayed at the top of the dashboard when the user's
 * email address has not been verified. The user can dismiss it for 24 hours.
 */
export const EmailVerificationBanner: React.FC = () => {
  const user = useAppSelector(selectAuthUser);
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!stored) return false;
    try {
      const expiry = parseInt(stored, 10);
      return Date.now() < expiry;
    } catch {
      return false;
    }
  });
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Don't show if user is verified, not logged in, or dismissed
  if (!user || user.isEmailVerified !== false || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    const expiry = Date.now() + DISMISS_DURATION_MS;
    localStorage.setItem(DISMISS_STORAGE_KEY, String(expiry));
    setDismissed(true);
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      const result = await authService.resendVerification(
        user.email,
        'user',
      );
      setResendMessage(
        result.message || 'Verification email sent. Please check your inbox.',
      );
    } catch (err) {
      setResendMessage(
        err instanceof Error
          ? err.message
          : 'Failed to send verification email.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className="w-5 h-5 text-amber-500 shrink-0"
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
          <p className="text-sm text-amber-800">
            <span className="font-medium">Email not verified.</span>{' '}
            Please verify your email address to unlock all features.
          </p>
          {resendMessage && (
            <span className="text-xs text-amber-700 shrink-0">
              {resendMessage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs font-semibold text-amber-700 underline hover:text-amber-800 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {resending ? 'Sending...' : 'Resend verification'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-amber-500 hover:text-amber-700 transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
