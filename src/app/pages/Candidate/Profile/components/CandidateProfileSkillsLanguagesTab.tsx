import React, { useState, useEffect, useRef } from 'react';
import type { CandidateProfileData } from '@/pages/Candidate/types';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { useToast } from '@/components/common/Toast';
import { useAppDispatch } from '@/hooks';
import { candidateProfileActions } from '../slice';
import { PRIMARY_COLOR_HEX } from '@/config/theme';

// ─── Common Skills Suggestions ───────────────────────────────────────────────────

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python',
  'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git',
  'Agile', 'Scrum', 'Project Management', 'Leadership', 'Communication',
  'Problem Solving', 'Critical Thinking', 'Team Collaboration', 'Time Management',
  'Data Analysis', 'Machine Learning', 'Data Science', 'DevOps', 'Cybersecurity',
  'UI/UX Design', 'Graphic Design', 'User Research', 'Wireframing', 'Prototyping',
  'Sales', 'Marketing', 'Customer Service', 'Business Development', 'Negotiation',
  'Accounting', 'Finance', 'Budgeting', 'Financial Analysis', 'Risk Management',
  'HR Management', 'Recruiting', 'Talent Acquisition', 'Employee Relations',
  'Operations Management', 'Supply Chain', 'Logistics', 'Quality Assurance',
  'Content Writing', 'Copywriting', 'Technical Writing', 'SEO', 'Social Media',
  'Mobile Development', 'iOS', 'Android', 'Flutter', 'React Native',
  'Testing', 'Unit Testing', 'Integration Testing', 'E2E Testing', 'TDD',
  'System Design', 'Architecture', 'Microservices', 'Serverless',
];

interface CandidateProfileSkillsLanguagesTabProps {
  profile: CandidateProfileData;
}

export const CandidateProfileSkillsLanguagesTab: React.FC<
  CandidateProfileSkillsLanguagesTabProps
> = ({ profile }) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  // Lists state
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);

  // Form input state
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (newSkill.trim().length > 0) {
      const filtered = COMMON_SKILLS.filter(
        (skill) =>
          skill.toLowerCase().includes(newSkill.toLowerCase()) &&
          !skills.includes(skill)
      );
      setFilteredSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [newSkill, skills]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (!clean) return;
    if (skills.includes(clean)) {
      toast('Skill already listed.', 'info');
      return;
    }
    setSkills([...skills, clean]);
    setNewSkill('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (skill: string) => {
    if (skills.includes(skill)) {
      toast('Skill already listed.', 'info');
      return;
    }
    setSkills([...skills, skill]);
    setNewSkill('');
    setShowSuggestions(false);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      handleSelectSuggestion(filteredSuggestions[0]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLanguage.trim();
    if (!clean) return;
    if (languages.includes(clean)) {
      toast('Language already listed.', 'info');
      return;
    }
    setLanguages([...languages, clean]);
    setNewLanguage('');
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      await makeCall({
        method: 'PATCH',
        route: API_ROUTES.candidates.profile,
        isSecureRoute: true,
        body: {
          skills,
          languages,
        },
      });
      toast('Skills & languages updated successfully.', 'success');
      dispatch(candidateProfileActions.fetchProfileRequest());
    } catch (err: any) {
      toast(err?.message || 'Failed to update skills and languages.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
          Skills &amp; Languages
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Specify your core competencies, technologies, and spoken languages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4" ref={skillsDropdownRef}>
          <h3 className="font-bold text-slate-800 text-sm">Professional Skills</h3>

          <form onSubmit={handleAddSkill} className="flex gap-2 relative">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onFocus={() => {
                if (newSkill.trim().length > 0) {
                  const filtered = COMMON_SKILLS.filter(
                    (skill) =>
                      skill.toLowerCase().includes(newSkill.toLowerCase()) &&
                      !skills.includes(skill)
                  );
                  setFilteredSuggestions(filtered.slice(0, 8));
                  setShowSuggestions(filtered.length > 0);
                }
              }}
              placeholder="e.g. JavaScript, Accounting, Design"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-700"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 !text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0"
            >
              Add
            </button>

            {/* Autocomplete Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn"
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {filteredSuggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
                    style={{
                      backgroundColor: idx === 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px] text-slate-400">add_circle</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {skills.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No skills added yet.</p>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 transition-all duration-200 hover:bg-indigo-100"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:bg-indigo-200/50 rounded-full p-0.5 inline-flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px] block">close</span>
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Languages Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Languages</h3>

          <form onSubmit={handleAddLanguage} className="flex gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="e.g. English, Amharic, French"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-700"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 !text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {languages.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No languages added yet.</p>
            ) : (
              languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang)}
                    className="hover:bg-emerald-100/50 rounded-full p-0.5 inline-flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px] block">close</span>
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={handleSave}
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
          {submitting ? 'Saving...' : 'Save Skills & Languages'}
        </button>
      </div>
    </div>
  );
};
