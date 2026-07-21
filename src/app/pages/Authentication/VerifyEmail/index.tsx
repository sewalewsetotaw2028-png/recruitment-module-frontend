import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { EmailVerificationSuccess } from '@/components/auth/EmailVerificationSuccess';

type VerificationStatus = 'verifying' | 'success' | 'expired' | 'error';

/**
 * Handles the email verification callback from the user clicking the link in their email.
 * The URL format is: /verify-email/:token?type=user|candidate
 */
export const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get('type') || 'user';

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token, userType);
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Verification failed.';
        if (
          message.toLowerCase().includes('expired') ||
          message.toLowerCase().includes('expire')
        ) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setErrorMessage(message);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, userType]);

  if (status === 'success') {
    return <EmailVerificationSuccess />;
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-12 bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-200">
        {status === 'verifying' && (
          <>
            {/* Spinner */}
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-indigo-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              Verifying your email...
            </h2>
            <p className="text-sm text-slate-500">Please wait a moment.</p>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              Link expired
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              This verification link has expired. Request a new verification email to continue.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
            >
              Go to sign in
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              Verification failed
            </h2>
            <p className="text-sm text-slate-600 mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
            >
              Go to sign in
            </button>
          </>
        )}
      </div>
    </main>
  );
};

export default VerifyEmailPage;
