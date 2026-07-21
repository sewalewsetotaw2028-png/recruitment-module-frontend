import React, { useState, useEffect } from 'react';
import type { JobTemplate, Vacancy } from '@/types';
import { RichTextField } from './RichTextField';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { fetchCompanyProfile } from '@/hooks/useCompanyProfile';

export interface JobDescriptionForm {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  benefits: string;
  employmentTerms: string;
  experienceRequired: string;
}

interface JobDescriptionEditorProps {
  vacancy: Vacancy;
  templates: JobTemplate[];
  onChange: (form: JobDescriptionForm) => void;
  onSave: (form: JobDescriptionForm) => void;
  onBack: () => void;
  onSaveAsTemplate: (form: JobDescriptionForm, templateName: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onPreview: () => void;
  onContinueToPosting: () => void;
}

const SECTION_TABS = [
  'Overview',
  'Responsibilities',
  'Qualifications',
  'Benefits',
] as const;

export const JobDescriptionEditor: React.FC<JobDescriptionEditorProps> = ({
  vacancy,
  templates,
  onChange,
  onSave,
  onBack,
  onSaveAsTemplate,
  onApplyTemplate,
  onPreview,
  onContinueToPosting,
}) => {
  const { can } = usePermissions();
  const canUpdate = can(PERMISSIONS.VACANCY_UPDATE);

  const [activeSection, setActiveSection] =
    useState<(typeof SECTION_TABS)[number]>('Overview');
  const [skillInput, setSkillInput] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateFilter, setTemplateFilter] = useState<
    'all' | 'premium' | 'core' | 'standard'
  >('all');
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  // Template confirmation dialog state
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  // Track saved state — true once Save Draft is clicked, reset on any change
  const [isSaved, setIsSaved] = useState(false);

  const [form, setForm] = useState<JobDescriptionForm>({
    title: vacancy.title || '',
    description: vacancy.description || '',
    responsibilities: vacancy.responsibilities || '',
    requirements: vacancy.requirements || '',
    skills: vacancy.skills || [],
    benefits: vacancy.benefits || '',
    employmentTerms: vacancy.employmentTerms || '',
    experienceRequired: vacancy.experienceRequired || '',
  });

  useEffect(() => {
    setForm({
      title: vacancy.title || '',
      description: vacancy.description || '',
      responsibilities: vacancy.responsibilities || '',
      requirements: vacancy.requirements || '',
      skills: vacancy.skills || [],
      benefits: vacancy.benefits || '',
      employmentTerms: vacancy.employmentTerms || '',
      experienceRequired: vacancy.experienceRequired || '',
    });
  }, [vacancy]);

  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        const profile = await fetchCompanyProfile();
        setCompanyProfile(profile);
      } catch (error) {
        console.error('Failed to load company profile:', error);
      }
    };
    void loadCompanyProfile();
  }, []);

  const update = (patch: Partial<JobDescriptionForm>) => {
    const updatedForm = { ...form, ...patch };
    setForm(updatedForm);
    onChange(updatedForm);
    setIsSaved(false); // any edit marks as unsaved
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    update({ skills: [...form.skills, s] });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    update({ skills: form.skills.filter((x) => x !== skill) });
  };

  const filteredTemplates = templates.filter(
    (t) =>
      templateFilter === 'all' || (t.roleTier || 'standard') === templateFilter,
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 bg-slate-50/50 min-h-screen">
      {/* Top Action Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-xl shadow-sm">
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="hover:text-slate-700 cursor-pointer" onClick={onBack}>
              Vacancies
            </span>
            <span className="material-symbols-outlined text-sm text-slate-400 select-none">
              chevron_right
            </span>
            <span className="text-indigo-600 font-semibold">
              Job Description Editor
            </span>
          </nav>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
               {vacancy.title}
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wide">
              {vacancy.vacancyStatus
                ? vacancy.vacancyStatus.replace('_', ' ')
                : 'Draft'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-all duration-150"
          >
            <span className="material-symbols-outlined text-lg text-slate-500">
              visibility
            </span>
            Full Preview
          </button>
          {canUpdate && (
            <button
              type="button"
              onClick={() =>
                onSaveAsTemplate(form, templateName || `${form.title} Template`)
              }
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-all duration-150"
            >
              <span className="material-symbols-outlined text-lg text-slate-500">
                save
              </span>
              Save as Template
            </button>
          )}
          {canUpdate && (
            <button
              type="button"
              onClick={() => { onSave(form); setIsSaved(true); }}
              className="px-4 py-2 border border-indigo-600 bg-white text-indigo-600 text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-50 active:bg-indigo-100/70 transition-all duration-150"
            >
              Save Draft
            </button>
          )}
          {canUpdate && isSaved ? (
            <button
              type="button"
              onClick={onContinueToPosting}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-150"
            >
              Continue to Posting →
            </button>
          ) : canUpdate && !isSaved ? (
            <button
              type="button"
              title="Save your changes first before continuing"
              onClick={() => { onSave(form); setIsSaved(true); }}
              className="px-5 py-2 bg-slate-200 text-slate-500 text-sm font-semibold rounded-lg shadow-sm cursor-not-allowed select-none border border-slate-300 relative group"
            >
              Continue to Posting →
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Save draft first
              </span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 text-sm font-semibold rounded-lg border border-slate-200 cursor-not-allowed select-none">
              <span className="material-symbols-outlined text-base">lock</span>
              Read-only
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Side: Template Library Panel */}
        <aside className="w-full xl:w-80 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col self-stretch xl:self-auto xl:sticky xl:top-4">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-slate-500">
                library_books
              </span>
              Template Library
            </h3>
            <div className="mt-3">
              <select
                value={templateFilter}
                onChange={(e) =>
                  setTemplateFilter(e.target.value as typeof templateFilter)
                }
                className="w-full text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg p-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              >
                <option value="all">All role tiers</option>
                <option value="premium">Premium</option>
                <option value="core">Core</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] xl:max-h-[500px]">
            {filteredTemplates.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No templates found in this tier.
              </p>
            ) : (
              filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => canUpdate && setPendingTemplateId(t.id)}
                  disabled={!canUpdate}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    vacancy.jobTemplateId === t.id
                      ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {t.name}
                    </p>
                    <span className="shrink-0 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                      {t.roleTier || 'standard'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description ||
                      'No description provided for this template.'}
                  </p>
                  {t.departmentName && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-medium">
                      <span className="material-symbols-outlined text-sm">
                        corporate_fare
                      </span>
                      <span className="truncate">{t.departmentName}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/30">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Template Configuration Name
            </label>
            <input
              type="text"
              placeholder="E.g., Senior Backend Engineer V2"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
        </aside>

        {/* Right Side: Tabbed Form Panels */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Navigation Tab Row */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 overflow-x-auto scrollbar-none">
            {SECTION_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveSection(tab)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all duration-150 ${
                  activeSection === tab
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Editor Framework Base Workspace */}
          <div className="p-6 space-y-6">
            {/* Global Job Title Input (Always visible) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Target Role Posting Title
              </label>
              <input
                className="w-full text-xl font-bold text-slate-900 border border-slate-200 rounded-xl p-3 shadow-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                placeholder="E.g., Senior TypeScript Developer"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                disabled={!canUpdate}
              />
            </div>

            {/* Overview Section */}
            <section
              className={activeSection === 'Overview' ? 'space-y-4' : 'hidden'}
            >
              {/* Company Description (Non-editable) */}
              {companyProfile?.description && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-indigo-600 text-xl">
                      business
                    </span>
                    <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">
                      About {companyProfile.name || 'Our Company'}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {companyProfile.description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  subject
                </span>
                <h4 className="text-md font-bold text-slate-800">
                  Role Summary & Executive Overview
                </h4>
              </div>
              <RichTextField
                value={form.description}
                onChange={(description) => update({ description })}
                placeholder="Describe the role, team context, organizational alignment, and broad performance impact..."
                rows={8}
              />
            </section>

            {/* Responsibilities Section */}
            <section
              className={
                activeSection === 'Responsibilities' ? 'space-y-4' : 'hidden'
              }
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  list_alt
                </span>
                <h4 className="text-md font-bold text-slate-800">
                  Key Execution Duties & Scope
                </h4>
              </div>
              <RichTextField
                value={form.responsibilities}
                onChange={(responsibilities) => update({ responsibilities })}
                placeholder="Provide individual clear lines of responsibility. Use the built-in rich markdown tools to highlight lists."
                rows={10}
                monospace
              />
            </section>

            {/* Qualifications Section */}
            <section
              className={
                activeSection === 'Qualifications' ? 'space-y-5' : 'hidden'
              }
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  verified
                </span>
                <h4 className="text-md font-bold text-slate-800">
                  Target Qualifications & Profile
                </h4>
              </div>

              <RichTextField
                value={form.requirements}
                onChange={(requirements) => update({ requirements })}
                placeholder="Academic profiles, mandatory certifications, regulatory frameworks, or explicit domain experience..."
                rows={6}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Experience Level Guidelines
                  </span>
                  <input
                    className="w-full text-sm text-slate-900 border border-slate-200 bg-white rounded-lg p-2.5 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-slate-400"
                    value={form.experienceRequired}
                    onChange={(e) =>
                      update({ experienceRequired: e.target.value })
                    }
                    placeholder="e.g., 5+ years with heavy scalable architectures"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Target Skills & Toolchains
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {form.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-full text-xs shadow-sm transition-all hover:border-slate-300"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          disabled={!canUpdate}
                          className="w-5 h-5 rounded-full inline-flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </span>
                    ))}

                    <div className="inline-flex items-center gap-1.5 ml-1">
                      <input
                        className="text-xs bg-white border border-dashed border-slate-300 rounded-full px-3 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        placeholder="Add explicit tag..."
                        value={skillInput}
                        disabled={!canUpdate}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), canUpdate && addSkill())
                        }
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        disabled={!canUpdate}
                        className="text-indigo-600 text-xs font-bold hover:text-indigo-700 px-1 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Benefits & Terms Section */}
            <section
              className={activeSection === 'Benefits' ? 'space-y-5' : 'hidden'}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="material-symbols-outlined text-slate-400 text-xl">
                    redeem
                  </span>
                  <h4 className="text-md font-bold text-slate-800">
                    Total Compensation, Benefits & Perks
                  </h4>
                </div>
                <RichTextField
                  value={form.benefits}
                  onChange={(benefits) => update({ benefits })}
                  placeholder="Comprehensive coverage details, base packages, healthcare stipends, equity models, or learning budgets..."
                  rows={5}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="material-symbols-outlined text-slate-400 text-xl">
                    gavel
                  </span>
                  <h4 className="text-md font-bold text-slate-800">
                    Contract Terms & Logistics Rules
                  </h4>
                </div>
                <RichTextField
                  value={form.employmentTerms}
                  onChange={(employmentTerms) => update({ employmentTerms })}
                  placeholder="Work models (remote/hybrid boundaries), specific working hours, target country limitations..."
                  rows={4}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Template Apply Confirmation Dialog */}
      {pendingTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-xl">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Apply Template?</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Applying this template will overwrite the current job description, responsibilities, requirements, and skills you have entered.
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium">This action cannot be undone unless you have already saved a draft.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPendingTemplateId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyTemplate(pendingTemplateId);
                  setIsSaved(false);
                  setPendingTemplateId(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
