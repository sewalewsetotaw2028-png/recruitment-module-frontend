import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';

/**
 * Allows users to request a magic link for passwordless sign-in.
 * Displays a simple email input and send button with success/error states.
 */
export const MagicLinkRequest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);

    try {
      const result = await authService.requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send magic link.',
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
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
        <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-2">
          Check your email
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          If an account exists with <strong>{email}</strong>, we've sent a
          sign-in link. Please check your inbox (and spam folder).
        </p>
        <Link
          to="/login"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-all"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 mb-3 animate-fade-in">
          {error}
        </div>
      )}

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
          autoFocus
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        disabled={sending}
      >
        {sending ? 'Sending...' : 'Send magic link'}
      </button>

      <p className="text-center text-xs text-slate-500 pt-2">
        <Link
          to="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-all"
        >
          Back to password sign in
        </Link>
      </p>
    </form>
  );
};

export default MagicLinkRequest;
