import { useCandidateJobSearchSlice } from './slice';
import { candidateJobSearchActions } from './slice';
import {
  selectJobSearchVacancies,
  selectJobSearchLoading,
  selectJobSearchError,
  selectJobSearchActionSuccess,
  selectJobSearchActionError,
} from './slice/selectors';
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useToast } from '@/components/common/Toast';
import { CandidateJobDetail } from '@/pages/Recruitment/Vacancies/components/job-posting/CandidateJobDetail';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { THEME_COLORS, TYPOGRAPHY } from '@/config/theme';
import { makeCall } from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';

export const CandidateJobSearchPage: React.FC = () => {
  const dispatch = useAppDispatch();
  useCandidateJobSearchSlice();
  const { toast } = useToast();

  const vacancies = useAppSelector(selectJobSearchVacancies);
  const loading = useAppSelector(selectJobSearchLoading);
  const error = useAppSelector(selectJobSearchError);
  const actionSuccess = useAppSelector(selectJobSearchActionSuccess);
  const actionError = useAppSelector(selectJobSearchActionError);

  const [jobBoardMode, setJobBoardMode] = useState<'external' | 'internal'>(
    'external',
  );
  const [jobSearch, setJobSearch] = useState('');
  const [jobDeptFilter, setJobDeptFilter] = useState('all');
  const [jobSalaryMin, setJobSalaryMin] = useState('');
  const [jobSkillFilter, setJobSkillFilter] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    null,
  );
  const [jobDetailVacancyId, setJobDetailVacancyId] = useState<string | null>(
    null,
  );
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [coverLetterType, setCoverLetterType] = useState<'text' | 'file'>('text');
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [expectedSalary, setExpectedSalary] = useState<string>('');
  const [recruitmentSourceId, setRecruitmentSourceId] = useState<string>('');
  const [recruitmentSources, setRecruitmentSources] = useState<Array<{id: string, name: string}>>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(candidateJobSearchActions.fetchVacanciesRequest());
  }, [dispatch]);

  useEffect(() => {
    // Fetch recruitment sources and applications
    const fetchRecruitmentSources = async () => {
      try {
        const res = await makeCall({
          method: 'GET',
          route: API_ROUTES.candidates.recruitmentSources,
          isSecureRoute: true,
        }) as Record<string, unknown>;
        const sources = (res?.data as Record<string, unknown> | undefined)?.data ?? res?.data ?? [];
        setRecruitmentSources(Array.isArray(sources) ? sources : []);
      } catch (err) {
        console.error('Failed to fetch recruitment sources:', err);
      }
    };

    const fetchApplications = async () => {
      try {
        const res = await makeCall({
          method: 'GET',
          route: API_ROUTES.candidates.applications,
          isSecureRoute: true,
        }) as Record<string, unknown>;
        const applications = (res?.data as Record<string, unknown> | undefined)?.data ?? res?.data ?? [];
        const vacancyIds = Array.isArray(applications) 
          ? applications.map((app: any) => app.vacancy_id).filter(Boolean)
          : [];
        setAppliedVacancyIds(vacancyIds);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      }
    };

    fetchRecruitmentSources();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (actionSuccess) {
      toast(actionSuccess, 'success');
      dispatch(candidateJobSearchActions.clearActions());
      setCoverLetter('');
      setCoverLetterType('text');
      setCoverLetterFile(null);
      setExpectedSalary('');
      setRecruitmentSourceId('');
      setSelectedVacancyId(null);
      setFormError(null);
      // Refresh applied vacancies after successful application
      if (selectedVacancyId) {
        setAppliedVacancyIds(prev => [...prev, selectedVacancyId]);
      }
    }
    if (actionError) {
      setFormError(actionError);
      dispatch(candidateJobSearchActions.clearActions());
    }
  }, [actionSuccess, actionError, dispatch, toast, selectedVacancyId]);

  const sourceList = vacancies;

  const jobDepartments: string[] = ['all'];
  const seen = new Set<string>();
  sourceList.forEach((v: any) => {
    const name: string = v.departmentName;
    if (!seen.has(name)) {
      seen.add(name);
      jobDepartments.push(name);
    }
  });

  const filterJobs = (list: typeof vacancies) =>
    list.filter((vac) => {
      const q = jobSearch.toLowerCase();
      const matchTitle =
        !q ||
        vac.title.toLowerCase().includes(q) ||
        vac.description.toLowerCase().includes(q) ||
        vac.departmentName.toLowerCase().includes(q);
      const matchDept =
        jobDeptFilter === 'all' || vac.departmentName === jobDeptFilter;
      const min = jobSalaryMin ? Number(jobSalaryMin) : 0;
      const salMin = vac.salaryMin ?? 0;
      const matchSalary = salMin >= min;
      const skills = (vac.skills ?? []).join(' ').toLowerCase();
      const matchSkill =
        !jobSkillFilter ||
        skills.includes(jobSkillFilter.toLowerCase()) ||
        vac.description.toLowerCase().includes(jobSkillFilter.toLowerCase());
      const matchFavorite = !showFavoritesOnly || savedJobIds.includes(vac.id);
      return matchTitle && matchDept && matchSalary && matchSkill && matchFavorite;
    });

  const boardVacancies = filterJobs(sourceList);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancyId) return;
    
    // Validate cover letter
    if (coverLetterType === 'text' && !coverLetter.trim()) {
      setFormError('Please enter a cover letter or upload a file');
      return;
    }
    if (coverLetterType === 'file' && !coverLetterFile) {
      setFormError('Please upload a cover letter file');
      return;
    }

    let coverLetterData: string | File | undefined;
    if (coverLetterType === 'text') {
      coverLetterData = coverLetter;
    } else if (coverLetterFile) {
      coverLetterData = coverLetterFile;
    }

    dispatch(
      candidateJobSearchActions.applyToJobRequest({
        vacancyId: selectedVacancyId,
        coverLetter: coverLetterData as any,
        expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
        recruitmentSourceId: recruitmentSourceId || undefined,
      }),
    );
  };

  const detailVac = jobDetailVacancyId
    ? vacancies.find((v) => v.id === jobDetailVacancyId)
    : null;

  const toggleSaveJob = (vacancyId: string) => {
    setSavedJobIds((prev) =>
      prev.includes(vacancyId)
        ? prev.filter((id) => id !== vacancyId)
        : [...prev, vacancyId],
    );
    toast(
      savedJobIds.includes(vacancyId) ? 'Job unsaved.' : 'Job saved!',
      'info',
    );
  };

  if (detailVac) {
    const isSaved = savedJobIds.includes(detailVac.id);
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setJobDetailVacancyId(null)}
            leftIcon={<span className="material-symbols-outlined text-base">arrow_back</span>}
            style={{ marginBottom: '24px' }}
          >
            Back to list
          </Button>
          <CandidateJobDetail
            vacancy={detailVac}
            isSaved={isSaved}
            isInternal={jobBoardMode === 'internal'}
            onApply={() => setSelectedVacancyId(detailVac.id)}
            onShare={() => {
              navigator.clipboard.writeText(window.location.href);
              toast('Job link copied to clipboard.', 'success');
            }}
            onToggleSave={() => toggleSaveJob(detailVac.id)}
            onBack={() => setJobDetailVacancyId(null)}
            onViewRecorded={() => {}}
          />
        </div>
        {selectedVacancyId && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 40, 71, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedVacancyId(null);
              }
            }}
          >
            <Card 
              padding="lg" 
              style={{ 
                maxWidth: '448px', 
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div className="flex justify-between items-center" style={{ borderBottom: `1px solid ${THEME_COLORS.borderLight}`, paddingBottom: '12px', marginBottom: '16px' }}>
                <h4 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.lg,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: THEME_COLORS.textPrimary,
                    margin: 0,
                  }}
                >
                  Submit Application
                </h4>
                <button
                  onClick={() => setSelectedVacancyId(null)}
                  style={{
                    color: THEME_COLORS.textTertiary,
                    padding: '4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleApplySubmit}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label 
                      style={{
                        fontSize: TYPOGRAPHY.fontSize.xs,
                        fontWeight: TYPOGRAPHY.fontWeight.bold,
                        textTransform: 'uppercase',
                        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                        color: THEME_COLORS.textTertiary,
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    >
                      Cover Letter
                    </label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setCoverLetterType('text')}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          fontFamily: TYPOGRAPHY.fontFamily.sans,
                          fontWeight: TYPOGRAPHY.fontWeight.regular,
                          color: coverLetterType === 'text' ? THEME_COLORS.primary : THEME_COLORS.textPrimary,
                          backgroundColor: coverLetterType === 'text' ? `${THEME_COLORS.primary}15` : THEME_COLORS.surface,
                          border: `1px solid ${coverLetterType === 'text' ? THEME_COLORS.primary : THEME_COLORS.border}`,
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverLetterType('file')}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          fontFamily: TYPOGRAPHY.fontFamily.sans,
                          fontWeight: TYPOGRAPHY.fontWeight.regular,
                          color: coverLetterType === 'file' ? THEME_COLORS.primary : THEME_COLORS.textPrimary,
                          backgroundColor: coverLetterType === 'file' ? `${THEME_COLORS.primary}15` : THEME_COLORS.surface,
                          border: `1px solid ${coverLetterType === 'file' ? THEME_COLORS.primary : THEME_COLORS.border}`,
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Upload File
                      </button>
                    </div>
                    {coverLetterType === 'text' ? (
                      <textarea
                        rows={5}
                        required
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell the recruiting team why you are a great fit for this position..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          fontFamily: TYPOGRAPHY.fontFamily.sans,
                          fontWeight: TYPOGRAPHY.fontWeight.regular,
                          color: THEME_COLORS.textPrimary,
                          backgroundColor: THEME_COLORS.slate50,
                          border: `1px solid ${THEME_COLORS.border}`,
                          borderRadius: '12px',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                          resize: 'none',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = THEME_COLORS.primary;
                          e.currentTarget.style.backgroundColor = THEME_COLORS.surface;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = THEME_COLORS.border;
                          e.currentTarget.style.backgroundColor = THEME_COLORS.slate50;
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          padding: '24px 16px',
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          fontFamily: TYPOGRAPHY.fontFamily.sans,
                          fontWeight: TYPOGRAPHY.fontWeight.regular,
                          color: THEME_COLORS.textPrimary,
                          backgroundColor: THEME_COLORS.slate50,
                          border: `1px solid ${THEME_COLORS.border}`,
                          borderRadius: '12px',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => document.getElementById('coverLetterFileInput')?.click()}
                      >
                        <input
                          id="coverLetterFileInput"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCoverLetterFile(file);
                            }
                          }}
                        />
                        {coverLetterFile ? (
                          <div>
                            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: THEME_COLORS.primary }}>
                              description
                            </span>
                            <div style={{ marginTop: '8px', fontWeight: TYPOGRAPHY.fontWeight.medium }}>
                              {coverLetterFile.name}
                            </div>
                            <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: THEME_COLORS.textSecondary }}>
                              {(coverLetterFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: THEME_COLORS.textSecondary }}>
                              cloud_upload
                            </span>
                            <div style={{ marginTop: '8px', color: THEME_COLORS.textSecondary }}>
                              Click to upload cover letter
                            </div>
                            <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: THEME_COLORS.textTertiary }}>
                              PDF, DOC, DOCX
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label 
                      style={{
                        fontSize: TYPOGRAPHY.fontSize.xs,
                        fontWeight: TYPOGRAPHY.fontWeight.bold,
                        textTransform: 'uppercase',
                        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                        color: THEME_COLORS.textTertiary,
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    >
                      Expected Salary
                    </label>
                    <Input
                      type="number"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="e.g. 50000"
                      size="md"
                    />
                  </div>
                  <div>
                    <label 
                      style={{
                        fontSize: TYPOGRAPHY.fontSize.xs,
                        fontWeight: TYPOGRAPHY.fontWeight.bold,
                        textTransform: 'uppercase',
                        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                        color: THEME_COLORS.textTertiary,
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    >
                      How did you hear about this position?
                    </label>
                    <select
                      value={recruitmentSourceId}
                      onChange={(e) => setRecruitmentSourceId(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 16px',
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        fontFamily: TYPOGRAPHY.fontFamily.sans,
                        fontWeight: TYPOGRAPHY.fontWeight.regular,
                        color: THEME_COLORS.textPrimary,
                        backgroundColor: THEME_COLORS.surface,
                        border: `1px solid ${THEME_COLORS.border}`,
                        borderRadius: '12px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select a source</option>
                      {recruitmentSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3" style={{ borderTop: `1px solid ${THEME_COLORS.borderLight}`, paddingTop: '12px', marginTop: '16px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedVacancyId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                    >
                      Submit Application
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b" style={{ borderColor: THEME_COLORS.border }}>
        <div>
          <h2 
            style={{
              fontSize: TYPOGRAPHY.heading.h2.fontSize,
              fontWeight: TYPOGRAPHY.heading.h2.fontWeight,
              lineHeight: TYPOGRAPHY.heading.h2.lineHeight,
              letterSpacing: TYPOGRAPHY.heading.h2.letterSpacing,
              color: THEME_COLORS.textPrimary,
              margin: 0,
            }}
          >
            Careers Board
          </h2>
          <p 
            style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: THEME_COLORS.textSecondary,
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            Browse open opportunities and submit your CV directly.
          </p>
        </div>

        {/* Toggle Switches */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: THEME_COLORS.slate100,
            padding: '4px',
            borderRadius: '12px',
            border: `1px solid ${THEME_COLORS.border}`,
          }}
        >
          <Button
            size="sm"
            variant={jobBoardMode === 'external' ? 'primary' : 'tertiary'}
            onClick={() => setJobBoardMode('external')}
            style={{
              backgroundColor: jobBoardMode === 'external' ? THEME_COLORS.surface : 'transparent',
              boxShadow: jobBoardMode === 'external' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            External Jobs
          </Button>
          <Button
            size="sm"
            variant={jobBoardMode === 'internal' ? 'primary' : 'tertiary'}
            onClick={() => setJobBoardMode('internal')}
            style={{
              backgroundColor: jobBoardMode === 'internal' ? THEME_COLORS.surface : 'transparent',
              boxShadow: jobBoardMode === 'internal' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Internal Postings
          </Button>
        </div>
      </div>

      {error && (
        <Card padding="md" style={{ borderColor: THEME_COLORS.errorLight, backgroundColor: THEME_COLORS.errorLight }}>
          <p style={{ color: THEME_COLORS.errorDark, fontWeight: TYPOGRAPHY.fontWeight.medium, margin: 0 }}>
            {error}
          </p>
        </Card>
      )}

      {loading && boardVacancies.length === 0 ? (
        <Card padding="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid THEME_COLORS.border',
                borderTopColor: THEME_COLORS.primary,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p 
              style={{
                color: THEME_COLORS.textSecondary,
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                margin: 0,
              }}
            >
              Loading vacancies…
            </p>
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </Card>
      ) : (
        <>
          {/* Modern Filter Panel */}
          <Card padding="lg" style={{ backgroundColor: THEME_COLORS.slate50 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textTertiary,
                  }}
                >
                  Keywords
                </label>
                <Input
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="e.g. Accountant, Lead"
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textTertiary,
                  }}
                >
                  Department
                </label>
                <select
                  value={jobDeptFilter}
                  onChange={(e) => setJobDeptFilter(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 16px',
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                    fontWeight: TYPOGRAPHY.fontWeight.regular,
                    color: THEME_COLORS.textPrimary,
                    backgroundColor: THEME_COLORS.surface,
                    border: `1px solid ${THEME_COLORS.border}`,
                    borderRadius: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {jobDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d === 'all' ? 'All Departments' : d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textTertiary,
                  }}
                >
                  Skills Required
                </label>
                <Input
                  value={jobSkillFilter}
                  onChange={(e) => setJobSkillFilter(e.target.value)}
                  placeholder="e.g. Python, Audit"
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textTertiary,
                  }}
                >
                  Min Salary
                </label>
                <Input
                  type="number"
                  value={jobSalaryMin}
                  onChange={(e) => setJobSalaryMin(e.target.value)}
                  placeholder="e.g. 35000"
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textTertiary,
                  }}
                >
                  Favorites
                </label>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                    fontWeight: TYPOGRAPHY.fontWeight.regular,
                    color: showFavoritesOnly ? THEME_COLORS.primary : THEME_COLORS.textPrimary,
                    backgroundColor: showFavoritesOnly ? `${THEME_COLORS.primary}15` : THEME_COLORS.surface,
                    border: `1px solid ${showFavoritesOnly ? THEME_COLORS.primary : THEME_COLORS.border}`,
                    borderRadius: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showFavoritesOnly ? 'favorite' : 'favorite_border'}
                  </span>
                  {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
                </button>
              </div>
            </div>
          </Card>

          {/* Job Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardVacancies.map((vac) => (
              <Card 
                key={vac.id} 
                padding="lg" 
                hover
                clickable
                onClick={() => setJobDetailVacancyId(vac.id)}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {vac.departmentName}
                    </Badge>
                    {vac.isUrgent && (
                      <Badge variant="warning" size="sm">
                        Urgent
                      </Badge>
                    )}
                    {appliedVacancyIds.includes(vac.id) && (
                      <Badge variant="success" size="sm">
                        Applied
                      </Badge>
                    )}
                  </div>

                  <h3 
                    style={{
                      fontSize: TYPOGRAPHY.fontSize.base,
                      fontWeight: TYPOGRAPHY.fontWeight.bold,
                      color: THEME_COLORS.textPrimary,
                      marginTop: '16px',
                      marginBottom: '4px',
                      margin: '16px 0 4px 0',
                    }}
                  >
                    {vac.title}
                  </h3>
                  <p 
                    style={{
                      fontSize: TYPOGRAPHY.fontSize.xs,
                      color: THEME_COLORS.textTertiary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      margin: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      location_on
                    </span>
                    {vac.location}
                  </p>
                  <p 
                    style={{
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: THEME_COLORS.textSecondary,
                      marginTop: '16px',
                      lineHeight: TYPOGRAPHY.lineHeight.relaxed,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: '16px 0 0 0',
                    }}
                  >
                    {vac.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex gap-3" style={{ borderTop: `1px solid ${THEME_COLORS.borderLight}`, paddingTop: '16px', marginTop: '24px' }}>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      setJobDetailVacancyId(vac.id);
                    }}
                  >
                    Learn More
                  </Button>
                  <Button 
                    size="sm" 
                    fullWidth
                    disabled={appliedVacancyIds.includes(vac.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVacancyId(vac.id);
                    }}
                  >
                    {appliedVacancyIds.includes(vac.id) ? 'Applied' : 'Apply Now'}
                  </Button>
                </div>
              </Card>
            ))}

            {boardVacancies.length === 0 && (
              <Card padding="lg" style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center',
                backgroundColor: THEME_COLORS.slate50,
                borderStyle: 'dashed',
              }}>
                <p 
                  style={{
                    color: THEME_COLORS.textTertiary,
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    margin: 0,
                  }}
                >
                  No vacancies current match your filter parameters.
                </p>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Quick Apply Modern Modal */}
      {selectedVacancyId && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 40, 71, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedVacancyId(null);
            }
          }}
        >
          <Card 
            padding="lg" 
            style={{ 
              maxWidth: '448px', 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-between items-center" style={{ borderBottom: `1px solid ${THEME_COLORS.borderLight}`, paddingBottom: '12px', marginBottom: '16px' }}>
              <h4 
                style={{
                  fontSize: TYPOGRAPHY.fontSize.lg,
                  fontWeight: TYPOGRAPHY.fontWeight.bold,
                  color: THEME_COLORS.textPrimary,
                  margin: 0,
                }}
              >
                Submit Application
              </h4>
              <button
                onClick={() => setSelectedVacancyId(null)}
                style={{
                  color: THEME_COLORS.textTertiary,
                  padding: '4px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = THEME_COLORS.textSecondary;
                  e.currentTarget.style.backgroundColor = THEME_COLORS.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = THEME_COLORS.textTertiary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close form"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}
              <div className="space-y-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textSecondary,
                  }}
                >
                  Cover Letter Notes
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCoverLetterType('text')}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontFamily: TYPOGRAPHY.fontFamily.sans,
                      fontWeight: TYPOGRAPHY.fontWeight.regular,
                      color: coverLetterType === 'text' ? THEME_COLORS.primary : THEME_COLORS.textPrimary,
                      backgroundColor: coverLetterType === 'text' ? `${THEME_COLORS.primary}15` : THEME_COLORS.surface,
                      border: `1px solid ${coverLetterType === 'text' ? THEME_COLORS.primary : THEME_COLORS.border}`,
                      borderRadius: '8px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverLetterType('file')}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontFamily: TYPOGRAPHY.fontFamily.sans,
                      fontWeight: TYPOGRAPHY.fontWeight.regular,
                      color: coverLetterType === 'file' ? THEME_COLORS.primary : THEME_COLORS.textPrimary,
                      backgroundColor: coverLetterType === 'file' ? `${THEME_COLORS.primary}15` : THEME_COLORS.surface,
                      border: `1px solid ${coverLetterType === 'file' ? THEME_COLORS.primary : THEME_COLORS.border}`,
                      borderRadius: '8px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Upload File
                  </button>
                </div>
                {coverLetterType === 'text' ? (
                  <textarea
                    rows={5}
                    required
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell the recruiting team why you are a great fit for this position..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontFamily: TYPOGRAPHY.fontFamily.sans,
                      fontWeight: TYPOGRAPHY.fontWeight.regular,
                      color: THEME_COLORS.textPrimary,
                      backgroundColor: THEME_COLORS.slate50,
                      border: `1px solid ${THEME_COLORS.border}`,
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      resize: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = THEME_COLORS.primary;
                      e.currentTarget.style.backgroundColor = THEME_COLORS.surface;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = THEME_COLORS.border;
                      e.currentTarget.style.backgroundColor = THEME_COLORS.slate50;
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      padding: '24px 16px',
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontFamily: TYPOGRAPHY.fontFamily.sans,
                      fontWeight: TYPOGRAPHY.fontWeight.regular,
                      color: THEME_COLORS.textPrimary,
                      backgroundColor: THEME_COLORS.slate50,
                      border: `1px solid ${THEME_COLORS.border}`,
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('coverLetterFileInputList')?.click()}
                  >
                    <input
                      id="coverLetterFileInputList"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverLetterFile(file);
                        }
                      }}
                    />
                    {coverLetterFile ? (
                      <div>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: THEME_COLORS.primary }}>
                          description
                        </span>
                        <div style={{ marginTop: '8px', fontWeight: TYPOGRAPHY.fontWeight.medium }}>
                          {coverLetterFile.name}
                        </div>
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: THEME_COLORS.textSecondary }}>
                          {(coverLetterFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: THEME_COLORS.textSecondary }}>
                          cloud_upload
                        </span>
                        <div style={{ marginTop: '8px', color: THEME_COLORS.textSecondary }}>
                          Click to upload cover letter
                        </div>
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: THEME_COLORS.textTertiary }}>
                          PDF, DOC, DOCX
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textSecondary,
                  }}
                >
                  Expected Salary
                </label>
                <Input
                  type="number"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="e.g. 50000"
                  size="md"
                />
              </div>
              <div className="space-y-1.5">
                <label 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
                    color: THEME_COLORS.textSecondary,
                  }}
                >
                  How did you hear about this position?
                </label>
                <select
                  value={recruitmentSourceId}
                  onChange={(e) => setRecruitmentSourceId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 16px',
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                    fontWeight: TYPOGRAPHY.fontWeight.regular,
                    color: THEME_COLORS.textPrimary,
                    backgroundColor: THEME_COLORS.surface,
                    border: `1px solid ${THEME_COLORS.border}`,
                    borderRadius: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select a source</option>
                  {recruitmentSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3" style={{ borderTop: `1px solid ${THEME_COLORS.borderLight}`, paddingTop: '12px', marginTop: '16px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedVacancyId(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CandidateJobSearchPage;
