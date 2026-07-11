import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  createEmptyScreeningCriterion,
  deleteScreeningCriteria,
  fetchScreeningCriteria,
  fetchScreeningCriteriaForVacancy,
  saveScreeningCriteriaForVacancy,
  createScreeningCriteria,
  type ScreeningCriteria,
  type ScreeningCriterion,
} from '@/hooks/useScreeningCriteria';
import { fetchVacancies } from '@/pages/Recruitment/Vacancies/api';
import type { Vacancy } from '@/types';
import { ScreeningCriteriaList } from '@/components/config/ScreeningCriteriaList';
import { ScreeningCriteriaDetail } from '@/components/config/ScreeningCriteriaDetail';

type Scope = 'template' | 'vacancy';

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

export const ScreeningCriteriaPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;
  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  const [scope, setScope] = useState<Scope>('template');
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    null,
  );
  const [criteriaRecord, setCriteriaRecord] = useState<ScreeningCriteria | null>(
    null,
  );
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingOverride, setRemovingOverride] = useState(false);

  const selectedVacancy = useMemo(
    () => vacancies.find((vacancy) => vacancy.id === selectedVacancyId) ?? null,
    [selectedVacancyId, vacancies],
  );

  const loadVacancies = useCallback(async (): Promise<string | null> => {
    setVacanciesLoading(true);
    try {
      const data = await fetchVacancies();
      setVacancies(data);
      let nextVacancyId: string | null = null;
      setSelectedVacancyId((current) => {
        nextVacancyId =
          current && data.some((vacancy) => vacancy.id === current)
            ? current
            : data[0]?.id ?? null;
        return nextVacancyId;
      });
      return nextVacancyId;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vacancies');
      return null;
    } finally {
      setVacanciesLoading(false);
    }
  }, []);

  const loadCriteria = useCallback(
    async (targetScope: Scope, vacancyId?: string | null) => {
      setCriteriaLoading(true);
      setError(null);
      try {
        const data =
          targetScope === 'template'
            ? await fetchScreeningCriteria()
            : await fetchScreeningCriteriaForVacancy(vacancyId as string);
        setCriteriaRecord(data[0] ?? null);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to load criteria',
        );
        setCriteriaRecord(null);
      } finally {
        setCriteriaLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  useEffect(() => {
    if (scope === 'vacancy' && !selectedVacancyId) return;
    loadCriteria(scope, selectedVacancyId);
  }, [loadCriteria, scope, selectedVacancyId]);

  const activeCriteriaRecord =
    scope === 'vacancy' && !selectedVacancyId ? null : criteriaRecord;

  const criteriaJson: ScreeningCriterion[] = useMemo(
    () =>
      activeCriteriaRecord?.criteria_json?.length
        ? activeCriteriaRecord.criteria_json
        : [createEmptyScreeningCriterion()],
    [activeCriteriaRecord],
  );

  const isActive = activeCriteriaRecord?.is_active ?? true;
  const hasVacancyOverride =
    scope === 'vacancy' &&
    !!activeCriteriaRecord &&
    activeCriteriaRecord.vacancy_id === selectedVacancyId;
  const canEditCurrentScope = canWrite && (scope === 'template' || !!selectedVacancyId);

  const scopeLabel =
    scope === 'template'
      ? 'Template Default'
      : selectedVacancy
        ? selectedVacancy.displayCode
        : 'Vacancy Override';

  const scopeDescription =
    scope === 'template'
      ? 'Manage the shared screening profile used when a vacancy does not have its own override. Saving here updates the company-level default.'
      : selectedVacancy
        ? `Editing screening criteria for ${selectedVacancy.title}. If no vacancy override exists yet, saving will create one.`
        : 'Select a vacancy to manage a vacancy-specific override.';

  const overrideNote =
    scope === 'vacancy' && selectedVacancy
      ? hasVacancyOverride
        ? 'This vacancy is using its own override. Saving updates that vacancy-specific profile.'
        : 'This vacancy currently inherits the template default. Saving will create an override.'
      : undefined;

  const handleSave = async (payload: {
    criteriaJson: ScreeningCriterion[];
    isActive: boolean;
  }) => {
    if (scope === 'vacancy') {
      if (!selectedVacancyId) {
        throw new Error('Select a vacancy before saving vacancy-specific criteria');
      }
      await saveScreeningCriteriaForVacancy(selectedVacancyId, payload);
      await loadCriteria('vacancy', selectedVacancyId);
      toast('Vacancy screening criteria saved successfully', 'success');
      return;
    }

    await createScreeningCriteria(payload);
    await loadCriteria('template');
    toast('Template screening criteria saved successfully', 'success');
  };

  const handleRemoveOverride = async () => {
    if (!selectedVacancyId || !criteriaRecord || !hasVacancyOverride) return;

    setRemovingOverride(true);
    try {
      await deleteScreeningCriteria(criteriaRecord.id);
      await loadCriteria('vacancy', selectedVacancyId);
      toast('Vacancy override removed. The template default is now active.', 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove override');
    } finally {
      setRemovingOverride(false);
    }
  };

  const handleRetry = async () => {
    const nextVacancyId = await loadVacancies();
    if (scope === 'vacancy' && nextVacancyId) {
      await loadCriteria('vacancy', nextVacancyId);
      return;
    }
    await loadCriteria('template');
  };

  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-5 select-none shrink-0 bg-white">
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
          Screening Criteria
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure standard screening rules and vacancy-specific overrides.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={() => void handleRetry()}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[320px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white">
          <ScreeningCriteriaList
            scope={scope}
            vacancies={vacancies}
            selectedVacancyId={selectedVacancyId}
            loadingVacancies={vacanciesLoading}
            hasVacancyOverride={hasVacancyOverride}
            currentRuleCount={criteriaJson.length}
            currentWeightTotal={criteriaJson.reduce(
              (sum, rule) => sum + Number(rule.weight || 0),
              0,
            )}
            onScopeChange={setScope}
            onVacancyChange={(vacancyId) =>
              setSelectedVacancyId(vacancyId || null)
            }
            onRemoveOverride={handleRemoveOverride}
            removingOverride={removingOverride}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          <ScreeningCriteriaDetail
            scopeLabel={scopeLabel}
            scopeDescription={scopeDescription}
            overrideNote={overrideNote}
            criteria={criteriaJson}
            isActive={isActive}
            loading={criteriaLoading}
            canWrite={canEditCurrentScope}
            onSave={handleSave}
          />
        </div>
      </div>
    </section>
  );
};

export default ScreeningCriteriaPage;
