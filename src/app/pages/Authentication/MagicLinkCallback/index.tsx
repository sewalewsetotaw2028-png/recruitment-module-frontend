import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

type CallbackStatus = 'verifying' | 'success' | 'error';

/**
 * Handles the magic link callback from the user clicking the link in their email.
 * The URL format is: /login/magic-link/callback?token=...&type=user|candidate
 * The backend returns an HTML page that stores tokens in localStorage and redirects to the frontend.
 * This component handles the case where the backend callback fails and the user lands here directly.
 */
export const MagicLinkCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'candidate';

    if (!token) {
      setStatus('error');
      setErrorMessage('No magic link token found. Please request a new sign-in link.');
      return;
    }

    // If we have a token, redirect to the backend callback endpoint
    // which will verify the token and set localStorage tokens
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/v1/auth/magic-link/callback?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
  }, [searchParams, navigate]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-12 bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-200">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-indigo-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              Signing you in...
            </h2>
            <p className="text-sm text-slate-500">Please wait a moment.</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              Sign-in failed
            </h2>
            <p className="text-sm text-slate-600 mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </main>
  );
};

export default MagicLinkCallbackPage;
