import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Displayed after a user successfully verifies their email.
 * Auto-redirects to the dashboard after 3 seconds.
 */
export const EmailVerificationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/login', { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-12 bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-200">
        {/* Success checkmark */}
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
          Email verified!
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your email address has been successfully verified. You can now sign in to access all features.
        </p>

        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
        >
          Continue to sign in
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
      </div>
    </main>
  );
};

export default EmailVerificationSuccess;
