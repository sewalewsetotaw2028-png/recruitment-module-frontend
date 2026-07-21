import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  fetchCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  uploadCompanyStamp,
} from '@/hooks/useCompanyProfile';
import type { CompanyProfile } from '@/hooks/useCompanyProfile';
import {
  applyCompanyThemeToDocument,
  buildCompanyTheme,
} from '@/utils/companyTheme';

const AccessDenied = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto my-12 animate-fade-in text-sm">
    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center shadow-xs">
      <span className="material-symbols-outlined text-red-500 text-xl">
        lock
      </span>
    </div>
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
      <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
        You don't have permission to access configuration settings. Contact your
        HR Administrator.
      </p>
    </div>
  </div>
);

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(
    /\/$/,
    '',
  );
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
};

export const CompanyProfilePage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();
  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [stampUrl, setStampUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const syncProfile = (data: CompanyProfile) => {
    setProfile(data);
    setCompanyName(data.name || '');
    setCompanyEmail(data.email || '');
    setLogoUrl(data.logo_url || '');
    setPrimaryColor(data.primary_color || '#4f46e5');
    setSecondaryColor(data.secondary_color || '#0f172a');
    setStampUrl(data.stamp_url || '');
    setIndustry(data.industry || '');
    setPhone(data.phone || '');
    setAddress(data.address || '');
    setWebsite(data.website || '');
    setDescription(data.description || '');
  };

  const applyThemeFromProfile = (data: CompanyProfile) => {
    applyCompanyThemeToDocument(
      buildCompanyTheme({
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      }),
    );
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanyProfile();
      syncProfile(data);
      applyThemeFromProfile(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load company profile';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canWrite) return;
    void loadProfile();
    // The page only needs the initial load on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canWrite]);

  const handleSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCompanyProfile({
        name: companyName || undefined,
        email: companyEmail || undefined,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        industry: industry || undefined,
        phone: phone || undefined,
        address: address || undefined,
        website: website || undefined,
        description: description || undefined,
      });
      syncProfile(updated);
      applyThemeFromProfile(updated);
      toast('Company profile updated successfully', 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save company profile';
      setError(message);
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!canWrite) return;
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingLogo(true);
    setError(null);
    try {
      const updated = await uploadCompanyLogo(file);
      syncProfile(updated);
      applyThemeFromProfile(updated);
      toast('Logo uploaded successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload logo';
      setError(message);
      toast(message, 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleStampUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!canWrite) return;
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingStamp(true);
    setError(null);
    try {
      const updated = await uploadCompanyStamp(file);
      syncProfile(updated);
      applyThemeFromProfile(updated);
      toast('Stamp uploaded successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload stamp';
      setError(message);
      toast(message, 'error');
    } finally {
      setUploadingStamp(false);
    }
  };

  if (!canWrite) return <AccessDenied />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined text-4xl text-indigo-600 animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const logoPreview = resolveAssetUrl(logoUrl || profile?.logo_url);
  const stampPreview = resolveAssetUrl(stampUrl || profile?.stamp_url);

  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm overflow-hidden bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 px-6 py-5 select-none shrink-0 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/dashboard/configuration"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition"
              >
                <span className="material-symbols-outlined text-base">
                  arrow_back
                </span>
                Back to Hub
              </Link>
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              Configuration
            </p>
            <h1 className="text-xl font-extrabold text-slate-800 mt-1 tracking-tight">
              Company Profile
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
              Configure branding, colors, and company contact details.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin leading-none">
                  progress_activity
                </span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={loadProfile}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] gap-6">
          <div className="space-y-6 min-w-0">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-4">
                Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="hr@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Technology"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="Company address..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Company Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Brief description of your company..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-4">
                Branding
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-2xl border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Company logo preview"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-3xl">
                          image
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                        Company Logo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white file:text-xs file:font-bold hover:file:bg-indigo-700 disabled:cursor-not-allowed"
                      />
                      <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                        Upload an image and we will save it to the database right
                        away.
                      </p>
                      <p className="mt-2 text-[10px] text-slate-400 break-all">
                        {logoUrl || 'No logo saved yet'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-2xl border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {stampPreview ? (
                        <img
                          src={stampPreview}
                          alt="Company stamp preview"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-3xl">
                          stamp
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                        Company Stamp
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStampUpload}
                        disabled={uploadingStamp}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white file:text-xs file:font-bold hover:file:bg-indigo-700 disabled:cursor-not-allowed"
                      />
                      <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                        This stamp is stored in the backend and reused anywhere the
                        company profile is rendered.
                      </p>
                      <p className="mt-2 text-[10px] text-slate-400 break-all">
                        {stampUrl || 'No stamp saved yet'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 min-w-0">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs sticky top-24">
              <h3 className="text-sm font-extrabold text-slate-900">
                Live Preview
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A quick look at the values currently saved for the company.
              </p>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div
                  className="h-16"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                />
                <div className="p-4 -mt-8">
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Company logo"
                            className="w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300">
                            image
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {companyName || 'Company Name'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {industry || 'Industry'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-base">
                          mail
                        </span>
                        <span className="truncate">
                          {companyEmail || 'email@example.com'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-base">
                          call
                        </span>
                        <span className="truncate">{phone || 'Phone number'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-base">
                          globe
                        </span>
                        <span className="truncate">{website || 'Website'}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: primaryColor || '#4f46e5' }}
                        >
                          Primary
                        </span>
                        <span
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: secondaryColor || '#0f172a' }}
                        >
                          Secondary
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {stampPreview ? (
                            <img
                              src={stampPreview}
                              alt="Company stamp"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300">
                              stamp
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-700">
                            Stamp preview
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {stampUrl || 'No stamp uploaded'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CompanyProfilePage;
