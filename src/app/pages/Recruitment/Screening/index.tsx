import { useScreeningSlice, screeningActions } from "./slice";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useToast } from "@/components/common/Toast";
import { FilterToolbar } from "@/components/shared/FilterToolbar";
import { ScreeningSummaryCards } from "./components/ScreeningSummaryCards";
import { CandidateCard } from "./components/CandidateCard";
import { RejectionModal } from "./components/RejectionModal";
import { ShortlistModal } from "./components/ShortlistModal";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/services/apiClient";
import { API_ROUTES } from "@/API/apiRoutes";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions-shared";
import type {
  ScreeningFilters as ScreeningFiltersType,
  RejectionData
} from "./types/screening.types";
import {
  selectScreeningApplications,
  selectScreeningError,
  selectScreeningLoading,
  selectScreeningActionLoading,
  selectScreeningActionError,
  selectScreeningActionSuccess
} from "./slice/selectors";

interface ConfigCriterion {
  field: string;
  operator: string;
  value: unknown;
  weight: number;
  label?: string;
}

export const ScreeningPage: React.FC = () => {
  useScreeningSlice();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.APPLICATION_READ);
  const canShortlist = can(PERMISSIONS.APPLICATION_SHORTLIST);
  const canReject = can(PERMISSIONS.APPLICATION_REJECT);

  const applications = useAppSelector(selectScreeningApplications);
  const loading = useAppSelector(selectScreeningLoading);
  const actionLoading = useAppSelector(selectScreeningActionLoading);
  const error = useAppSelector(selectScreeningError);
  const actionError = useAppSelector(selectScreeningActionError);
  const actionSuccess = useAppSelector(selectScreeningActionSuccess);

  const [filters, setFilters] = useState<ScreeningFiltersType>({
    vacancyFilterId: "all",
    filterExperienceMin: 0,
    filterFieldOfStudy: "",
    filterSkill: ""
  });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [pendingShortlistName, setPendingShortlistName] = useState<
    string | null
  >(null);

  // Configured screening criteria loaded from /config/screening-criteria
  const [configCriteria, setConfigCriteria] = useState<ConfigCriterion[]>([]);
  const [configCriteriaLoading, setConfigCriteriaLoading] = useState(false);

  const loadConfigCriteria = useCallback(async (vacancyId?: string) => {
    setConfigCriteriaLoading(true);
    try {
      const route =
        vacancyId && vacancyId !== "all"
          ? API_ROUTES.config.screeningCriteriaByVacancy(vacancyId)
          : API_ROUTES.config.screeningCriteria;
      const res: any = await apiFetch(route);
      const rows: any[] = Array.isArray(res?.data) ? res.data : [];
      // Use the first active criteria record's criteria_json
      const active = rows.find((r) => r.is_active !== false) ?? rows[0];
      const json: ConfigCriterion[] = Array.isArray(active?.criteria_json)
        ? active.criteria_json
        : [];
      setConfigCriteria(json);
    } catch {
      setConfigCriteria([]);
    } finally {
      setConfigCriteriaLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(screeningActions.fetchScreeningRequest());
    loadConfigCriteria();
  }, [dispatch, loadConfigCriteria]);

  // Re-load criteria when vacancy filter changes
  useEffect(() => {
    loadConfigCriteria(
      filters.vacancyFilterId !== "all" ? filters.vacancyFilterId : undefined
    );
  }, [filters.vacancyFilterId, loadConfigCriteria]);

  const handleFilterChange = (newFilters: Partial<ScreeningFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRejectSubmit = (data: RejectionData) => {
    const selectedRecord = applications.find(
      (application) => application.id === selectedAppId
    );
    if (!selectedRecord) return;

    dispatch(
      screeningActions.rejectApplicationRequest({
        applicationId: selectedRecord.id,
        status: data.addToTalentRoster ? "moved_to_talent_roster" : "rejected",
        currentStage: "Rejected",
        notes: data.notes,
        rejectionReason: data.reason,
        addToTalentRoster: data.addToTalentRoster,
        futureFitTag: data.futureFitTag,
        screeningCriteria: selectedRecord.screeningCriteria
      })
    );
    setShowRejectModal(false);
    setSelectedAppId(null);
    setSelectedRecordId(null);
  };

  const handleShortlist = (applicationId: string) => {
    const selectedRecord = applications.find(
      (application) => application.id === applicationId
    );
    if (!selectedRecord) return;

    setSelectedAppId(applicationId);
    setPendingShortlistName(selectedRecord.candidateName);
    setShowShortlistModal(true);
  };

  const handleShortlistSubmit = (data: { notes: string }) => {
    const selectedRecord = applications.find(
      (application) => application.id === selectedAppId
    );
    if (!selectedRecord) return;

    dispatch(
      screeningActions.shortlistApplicationRequest({
        applicationId: selectedAppId!,
        status: "shortlisted",
        currentStage: "Shortlisted",
        notes: data.notes || "Candidate shortlisted after screening review.",
        screeningCriteria: selectedRecord.screeningCriteria
      })
    );
    setShowShortlistModal(false);
    setSelectedAppId(null);
    setSelectedRecordId(null);
  };

  // Clear stale action state on mount to prevent toast repetition
  useEffect(() => {
    dispatch(screeningActions.clearActionState());
  }, [dispatch]);

  useEffect(() => {
    if (!actionSuccess) return;

    if (actionSuccess.startsWith("shortlist:")) {
      toast(
        `${pendingShortlistName ?? "Candidate"} shortlisted. Redirecting…`,
        "success"
      );
      setPendingShortlistName(null);
      dispatch(screeningActions.clearActionState());
      navigate("/dashboard/shortlisted");
      return;
    }

    if (actionSuccess.startsWith("talentpool:")) {
      toast("Candidate rejected and added to talent pool.", "success");
      dispatch(screeningActions.clearActionState());
      navigate("/dashboard/roster");
      return;
    }

    if (actionSuccess.startsWith("reject:")) {
      toast("Candidate rejected.", "success");
      dispatch(screeningActions.clearActionState());
    }
  }, [actionSuccess, dispatch, navigate, pendingShortlistName, toast]);

  useEffect(() => {
    if (actionError) {
      toast(actionError, "error");
    }
  }, [actionError, toast]);

  const matchCandidateFilters = (app: (typeof applications)[0]) => {
    if (
      filters.vacancyFilterId !== "all" &&
      app.vacancyId !== filters.vacancyFilterId
    )
      return false;

    if (filters.filterExperienceMin > 0) {
      const totalMonths = app.candidate.yearsOfExperience * 12;
      if (totalMonths < filters.filterExperienceMin) return false;
    }

    if (filters.filterFieldOfStudy.trim()) {
      const matches = app.candidate.educations.some((edu) =>
        edu.fieldOfStudy
          .toLowerCase()
          .includes(filters.filterFieldOfStudy.trim().toLowerCase())
      );
      if (!matches) return false;
    }

    if (filters.filterSkill.trim()) {
      const matches = app.candidate.skills.some((skill) =>
        skill.toLowerCase().includes(filters.filterSkill.trim().toLowerCase())
      );
      if (!matches) return false;
    }

    return true;
  };

  const pipelineApplications = applications;

  const filteredApplications = pipelineApplications.filter(
    matchCandidateFilters
  );

  const vacancyOptions = useMemo(
    () =>
      Array.from(
        new Map(
          applications.map((application) => [
            application.vacancyId,
            { value: application.vacancyId, label: application.vacancyTitle }
          ])
        ).values()
      ),
    [applications]
  );

  const selectedRecord = applications.find(
    (application) => application.id === selectedRecordId
  );

  // Show criteria from application (already evaluated) OR from config (for reference)
  const visibleCriteria =
    filteredApplications.find(
      (application) =>
        filters.vacancyFilterId === "all" ||
        application.vacancyId === filters.vacancyFilterId
    )?.screeningCriteria ?? [];

  // Show config criteria when no evaluated application criteria exist
  const activeCriteriaToShow =
    visibleCriteria.length > 0
      ? visibleCriteria.map((c) => ({ ...c, fromApplication: true }))
      : configCriteria.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          weight: c.weight,
          met: false,
          score: 0,
          fromApplication: false
        }));

  const summary = useMemo(
    () => ({
      inPipeline: pipelineApplications.length,
      submitted: pipelineApplications.filter(
        (a) => a.applicationStatus === "submitted"
      ).length,
      inScreening: pipelineApplications.filter(
        (a) => String(a.currentStage).toUpperCase() === "SCREENING"
      ).length,
      highMatch: pipelineApplications.filter((a) => a.matchScore >= 80).length
    }),
    [pipelineApplications]
  );

  const clearFilters = () => {
    setFilters({
      vacancyFilterId: "all",
      filterExperienceMin: 0,
      filterFieldOfStudy: "",
      filterSkill: ""
    });
  };

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {!canRead ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-rose-400">lock</span>
          <p className="text-sm font-bold text-rose-700">Access restricted</p>
          <p className="text-xs text-rose-500">You do not have permission to view screening.</p>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
            Screening
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Candidate screening hub
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Apply configured criteria, shortlist qualified applicants, or reject
            with talent roster capture.
          </p>
        </div>
        {canShortlist && (
          <button
            type="button"
            className="border border-indigo-400 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            onClick={() => navigate("/dashboard/shortlisted")}
          >
            <span className="material-symbols-outlined text-[18px]">
              playlist_add_check
            </span>
            View shortlist
          </button>
        )}
      </div>

      <ScreeningSummaryCards summary={summary} />

      <FilterToolbar
        fields={[
          {
            key: "vacancy",
            label: "Vacancy",
            type: "select",
            value: filters.vacancyFilterId,
            onChange: (value) => handleFilterChange({ vacancyFilterId: value }),
            options: [
              { value: "all", label: "All vacancies" },
              ...vacancyOptions
            ]
          },
          {
            key: "experience",
            label: "Min experience (months)",
            type: "number",
            value: String(filters.filterExperienceMin),
            onChange: (value) =>
              handleFilterChange({
                filterExperienceMin: parseInt(value, 10) || 0
              })
          },
          {
            key: "field",
            label: "Field of study",
            type: "search",
            placeholder: "e.g. Finance, Computer Science",
            value: filters.filterFieldOfStudy,
            onChange: (value) =>
              handleFilterChange({ filterFieldOfStudy: value })
          },
          {
            key: "skill",
            label: "Skill",
            type: "search",
            placeholder: "e.g. React, AML",
            value: filters.filterSkill,
            onChange: (value) => handleFilterChange({ filterSkill: value })
          }
        ]}
        onClear={clearFilters}
        resultCount={filteredApplications.length}
        resultLabel="candidates"
      />

      {/* Screening Criteria Panel — from config OR embedded in applications */}
      {(activeCriteriaToShow.length > 0 || configCriteriaLoading) && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                {visibleCriteria.length > 0
                  ? "Evaluated criteria"
                  : "Configured criteria (template)"}
              </p>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                {visibleCriteria.length > 0
                  ? "Screening rules applied to this candidate"
                  : "Active screening rules from configuration"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                {activeCriteriaToShow.length} rule
                {activeCriteriaToShow.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {configCriteriaLoading ? (
            <p className="text-xs text-slate-400 animate-pulse">
              Loading criteria…
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeCriteriaToShow.map((criterion, index) => (
                <span
                  key={`${criterion.field}-${index}`}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                    (criterion as any).fromApplication
                      ? criterion.met
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {criterion.field}: {String(criterion.value ?? "required")}
                  {(criterion as any).fromApplication && (
                    <span className="ml-1">{criterion.met ? "✓" : "✗"}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidates */}
      <div className="w-full">
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Loading screening applications...
          </div>
        )}
        {!loading && filteredApplications.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-slate-50 text-slate-400 border border-slate-100 mb-3">
              <span className="material-symbols-outlined text-[22px]">
                inbox
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              No matching profiles found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              Adjust filters or wait for new applications on open vacancies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((application) => (
              <CandidateCard
                key={application.id}
                record={application}
                onShortlist={canShortlist ? (record) => handleShortlist(record.id) : undefined}
                onReject={canReject ? (record) => {
                  setSelectedAppId(record.id);
                  setSelectedRecordId(record.id);
                  setShowRejectModal(true);
                } : undefined}
                onViewDetails={(record) => {
                  setSelectedRecordId(record.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <RejectionModal
        isOpen={showRejectModal}
        candidateName={
          applications.find((application) => application.id === selectedAppId)
            ?.candidateName
        }
        onClose={() => {
          setShowRejectModal(false);
          setSelectedAppId(null);
          if (!actionLoading) {
            setSelectedRecordId(null);
          }
        }}
        onSubmit={handleRejectSubmit}
        isSubmitting={actionLoading}
      />

      <ShortlistModal
        isOpen={showShortlistModal}
        candidateName={
          applications.find((application) => application.id === selectedAppId)
            ?.candidateName
        }
        onClose={() => {
          setShowShortlistModal(false);
          setSelectedAppId(null);
          if (!actionLoading) {
            setSelectedRecordId(null);
          }
        }}
        onSubmit={handleShortlistSubmit}
        isSubmitting={actionLoading}
      />

      {/* Candidate Detail Modal */}
      <Modal
        isOpen={Boolean(selectedRecord) && !showRejectModal && !showShortlistModal}
        onClose={() => setSelectedRecordId(null)}
        title={
          selectedRecord ? selectedRecord.candidateName : "Candidate profile"
        }
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-5 text-sm text-slate-700">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Candidate
                </p>
                <p className="font-semibold text-slate-900">
                  {selectedRecord.candidate.currentPosition ||
                    "Position not specified"}
                </p>
                <p>{selectedRecord.candidate.email}</p>
                {selectedRecord.candidate.phone && (
                  <p>{selectedRecord.candidate.phone}</p>
                )}
                <p>
                  {selectedRecord.candidate.yearsOfExperience} yr(s) experience
                </p>
                <p className="font-semibold text-indigo-600">
                  Match score: {selectedRecord.matchScore}%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Vacancy
                </p>
                <p className="font-semibold text-slate-900">
                  {selectedRecord.vacancy.title}
                </p>
                <p>{selectedRecord.vacancy.departmentName}</p>
                <p>{selectedRecord.vacancy.location}</p>
                <p className="capitalize">
                  {selectedRecord.vacancy.employmentType.replace("_", " ")}
                </p>
              </div>
            </div>

            {selectedRecord.candidate.skills.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.screeningCriteria.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Criteria results
                </p>
                <div className="space-y-2">
                  {selectedRecord.screeningCriteria.map((criterion, index) => (
                    <div
                      key={`${criterion.field}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {criterion.field}
                        </p>
                        <p className="text-xs text-slate-500">
                          Expected: {String(criterion.value ?? "required")}
                        </p>
                        {criterion.actualValue !== undefined && (
                          <p className="text-xs text-slate-500">
                            Actual: {String(criterion.actualValue)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${criterion.met ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {criterion.met ? "Matched" : "Not matched"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              {canReject && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordId(null);
                    setSelectedAppId(selectedRecord.id);
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 transition"
                >
                  Reject
                </button>
              )}
              {canShortlist && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordId(null);
                    handleShortlist(selectedRecord.id);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Shortlist
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
        </>
      )}
    </section>
  );
};

export default ScreeningPage;
