import React, { useEffect, useMemo, useState } from 'react';
import type { CandidateProfileData } from '@/pages/Candidate/types';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { PROFILE_THEME } from './profileTheme';

// ─── Main Component ───────────────────────────────────────────────────────────

interface CandidateProfileOverviewTabProps {
  profile: CandidateProfileData;
  totalExperience: number;
}

export const CandidateProfileOverviewTab: React.FC<
  CandidateProfileOverviewTabProps
> = ({ profile, totalExperience }) => {
  const [apiCompleteness, setApiCompleteness] = useState<any>(null);

  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        const res = (await makeCall({
          method: 'GET',
          route: API_ROUTES.candidates.completeness,
          isSecureRoute: true,
        })) as any;
        setApiCompleteness(res?.data?.data ?? res?.data ?? null);
      } catch (err) {
        console.error('Failed to fetch completeness:', err);
      }
    };
    fetchCompleteness();
  }, []);

  const completeness = useMemo(() => {
    // Always use the backend API completeness for consistency with dashboard
    if (typeof apiCompleteness?.percentage === 'number') {
      return {
        percentage: apiCompleteness.percentage,
        sections: apiCompleteness.sections || [],
      };
    }

    // Fallback to local calculation only if API fails
    const sections = [
      {
        key: 'photo',
        label: 'Profile photo',
        complete: Boolean(profile.photo),
      },
      {
        key: 'contact',
        label: 'Primary contact',
        complete: Boolean(profile.phone || profile.phones?.length),
      },
      {
        key: 'identity',
        label: 'Identity details',
        complete: Boolean(profile.gender || profile.date_of_birth || profile.nationality),
      },
      {
        key: 'location',
        label: 'Address',
        complete: Boolean(profile.location || profile.current_address || profile.addresses?.length),
      },
      {
        key: 'employment',
        label: 'Employment profile',
        complete: Boolean(profile.current_position || profile.current_employer || profile.years_of_experience),
      },
      {
        key: 'summary',
        label: 'Professional summary',
        complete: Boolean(profile.remarks?.trim()),
      },
      {
        key: 'experience',
        label: 'Work history',
        complete: profile.experiences.length > 0,
      },
      {
        key: 'education',
        label: 'Education',
        complete: profile.educations.length > 0,
      },
      {
        key: 'skills',
        label: 'Skills',
        complete: profile.skills.length > 0,
      },
      {
        key: 'languages',
        label: 'Languages',
        complete: profile.languages.length > 0,
      },
      {
        key: 'documents',
        label: 'Documents',
        complete: profile.documents.length > 0,
      },
      {
        key: 'certifications',
        label: 'Certifications',
        complete: profile.certifications.length > 0,
      },
      {
        key: 'preferences',
        label: 'Job preferences',
        complete: Boolean(
          profile.preferred_job_category ||
            profile.preferred_location ||
            profile.expected_salary ||
            profile.availability_status,
        ),
      },
    ];

    const completedCount = sections.filter((section) => section.complete).length;
    const fallbackPercentage = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0;

    return {
      percentage: fallbackPercentage,
      sections,
    };
  }, [apiCompleteness, profile]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
    });
  };

  const getPrimaryPhone = () => {
    if (!profile.phones || profile.phones.length === 0) return 'N/A';
    const primary = profile.phones.find((p) => p.is_primary);
    return primary?.phone_number || profile.phones[0].phone_number;
  };

  const getPrimaryAddress = () => {
    if (!profile.addresses || profile.addresses.length === 0) return 'N/A';
    const addr = profile.addresses[0];
    const parts = [addr.city, addr.region, addr.sub_city, addr.woreda].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Completeness & Summary Row */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Professional Summary */}
        {profile.remarks && (
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>description</span>
              Professional Summary
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{profile.remarks}</p>
          </div>
        )}

        {/* Completeness Badge */}
        {completeness && (
          <div className="flex-shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center min-w-[120px]">
              <div className="text-3xl font-extrabold text-slate-900">{completeness.percentage}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Complete</div>
            </div>
          </div>
        )}
      </div>

      {/* Personal Info Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>person</span>
          Personal Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</div>
            <div className="text-sm font-semibold text-slate-700">{profile.firstName} {profile.lastName}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</div>
            <div className="text-sm font-semibold text-slate-700 truncate">{profile.email}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Phone</div>
            <div className="text-sm font-semibold text-slate-700">{getPrimaryPhone()}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gender</div>
            <div className="text-sm font-semibold text-slate-700">{profile.gender || 'Not specified'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date of Birth</div>
            <div className="text-sm font-semibold text-slate-700">{formatDate(profile.date_of_birth)}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nationality</div>
            <div className="text-sm font-semibold text-slate-700">{profile.nationality || 'Not specified'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Address</div>
            <div className="text-sm font-semibold text-slate-700">{getPrimaryAddress()}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Experience</div>
            <div className="text-sm font-semibold text-slate-700">{totalExperience || profile.years_of_experience || 0} years</div>
          </div>
        </div>
      </div>

      {/* Education Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>school</span>
          Education
        </h3>
        {profile.educations && profile.educations.length > 0 ? (
          <div className="space-y-4">
            {profile.educations.map((edu, idx) => (
              <div key={edu.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROFILE_THEME.primary }} />
                  {idx < profile.educations!.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-4">
                  <div className="font-bold text-slate-900 text-sm">{edu.degree}</div>
                  <div className="text-slate-600 text-xs mt-0.5">{edu.institution}</div>
                  <div className="text-slate-400 text-[10px] mt-1">{edu.fieldOfStudy} • {edu.graduationYear}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">No education added yet</div>
        )}
      </div>

      {/* Experience Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>work</span>
          Work Experience
        </h3>
        {profile.experiences && profile.experiences.length > 0 ? (
          <div className="space-y-4">
            {profile.experiences.map((exp, idx) => (
              <div key={exp.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROFILE_THEME.primary }} />
                  {idx < profile.experiences!.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-4">
                  <div className="font-bold text-slate-900 text-sm">{exp.position}</div>
                  <div className="text-slate-600 text-xs mt-0.5">{exp.companyName}</div>
                  <div className="text-slate-400 text-[10px] mt-1">
                    {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                  </div>
                  {exp.description && (
                    <div className="text-slate-500 text-xs mt-2 leading-relaxed">{exp.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">No experience added yet</div>
        )}
      </div>

      {/* Skills & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>psychology</span>
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: PROFILE_THEME.primaryLighter,
                    color: PROFILE_THEME.primaryText,
                  }}
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-sm">No skills added yet</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>translate</span>
            Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.languages && profile.languages.length > 0 ? (
              profile.languages.map((lang, idx) => (
                <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-sm">No languages added yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Certifications */}
      {profile.certifications && profile.certifications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>verified</span>
            Certifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certifications.map((cert) => (
              <div key={cert.id} className="bg-slate-50 rounded-xl p-4">
                <div className="font-bold text-slate-900 text-sm">{cert.name}</div>
                {cert.issuing_organization && (
                  <div className="text-slate-600 text-xs mt-0.5">{cert.issuing_organization}</div>
                )}
                {cert.issue_date && (
                  <div className="text-slate-400 text-[10px] mt-1">Issued: {formatDate(cert.issue_date)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {profile.documents && profile.documents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>folder</span>
            Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">description</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{doc.name}</div>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: PROFILE_THEME.primary }}>
                    View document
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: PROFILE_THEME.primary }}>
            tune
          </span>
          Job Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Category</div>
            <div className="text-sm font-semibold text-slate-700">{profile.preferred_job_category || 'Not specified'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Location</div>
            <div className="text-sm font-semibold text-slate-700">{profile.preferred_location || 'Not specified'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Expected Salary</div>
            <div className="text-sm font-semibold text-slate-700">
              {profile.expected_salary ? `$${profile.expected_salary.toLocaleString()}/year` : 'Not specified'}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Availability</div>
            <div className="text-sm font-semibold text-slate-700">
              {profile.availability_status?.replace(/_/g, ' ') || 'Not specified'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
