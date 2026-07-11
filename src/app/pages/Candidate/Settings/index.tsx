import React, { useState } from 'react';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';
import { useToast } from '@/components/common/Toast';
import { PRIMARY_COLOR_HEX } from '@/config/theme';

export const CandidateSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await makeCall({
        method: 'POST',
        route: API_ROUTES.candidates.changePassword,
        isSecureRoute: true,
        data: {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
      });
      toast('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err?.message || 'Failed to update password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased space-y-6">
      <PageSectionHeader
        eyebrow="Candidate Portal"
        title="Settings"
        description="Update your credentials, manage security settings, and configure communication preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Security Settings */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Change Password
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Ensure your account is secure by using a strong, unique password.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2.5 !text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR_HEX }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
              >
                {submitting ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Preference place holders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Communication Preferences
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Configure how you receive status updates and interview invitations.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="rounded text-primary border-slate-200 focus:ring-primary focus:ring-offset-0 focus:ring-1"
                style={{ accentColor: PRIMARY_COLOR_HEX }}
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Email Updates</span>
                <span className="text-[10px] text-slate-400">Receive application &amp; offer updates</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="rounded text-primary border-slate-200 focus:ring-primary focus:ring-offset-0 focus:ring-1"
                style={{ accentColor: PRIMARY_COLOR_HEX }}
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">SMS Notifications</span>
                <span className="text-[10px] text-slate-400">Receive text reminder for upcoming rounds</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSettingsPage;
