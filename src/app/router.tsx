import React from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { DashboardLayout } from '@/components/DefaultLayout/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleGuard } from '@/routes/RoleGuard';
import { LoginPage } from './pages/Authentication/Login';
import { SignupPage } from './pages/Authentication/Signup';
import { VerifyEmailPage } from './pages/Authentication/VerifyEmail';
import { EmailVerificationPending } from './components/auth/EmailVerificationPending';
import { MagicLinkRequest } from './components/auth/MagicLinkRequest';
import { MagicLinkCallbackPage } from './pages/Authentication/MagicLinkCallback';
import { DashboardHomePage } from './pages/Recruitment/Dashboard';
import { WorkforcePlanningListPage } from './pages/Recruitment/WorkforcePlanning';
import { WorkforcePlanningCreatePage } from './pages/Recruitment/WorkforcePlanningCreate';
import { RecruitmentRequestListPage } from './pages/Recruitment/RecruitmentRequests';
import { RecruitmentRequestCreatePage } from './pages/Recruitment/RecruitmentRequestCreate';
import { VacancyHub } from './pages/Recruitment/Vacancies';
import { EvaluationResultsPage } from './pages/Recruitment/Vacancies/EvaluationResultsPage';
import { HiringMinutePage } from './pages/Recruitment/Vacancies/HiringMinutePage';
import { EvaluateInterviewPage } from './pages/Recruitment/Interviews/EvaluateInterviewPage';
import { ScreeningPage } from './pages/Recruitment/Screening';
import { CandidateApplicationsPage } from './pages/Candidate/Applications';
import { CandidateJobSearchPage } from './pages/Candidate/JobSearch';
import { CandidateProfilePage } from './pages/Candidate/Profile';
import { HRSettingsPage } from './pages/Recruitment/Settings';
import { StaffNotificationsPage } from './pages/Recruitment/Notifications';
import { CandidateOffersPage } from './pages/Candidate/Offers';
import { CandidateInterviewsPage } from './pages/Candidate/Interviews';
import { CandidateSettingsPage } from './pages/Candidate/Settings';
import { ApplicationDetailPage } from './pages/Candidate/Applications/Detail';
import { CandidateNotificationsPage } from './pages/Candidate/Notifications';
import { OfferListPage } from './pages/Recruitment/Offers';
import { TalentPoolPage } from './pages/Recruitment/TalentPool';
import { InterviewListPage } from './pages/Recruitment/Interviews';
import { ShortlistedPage } from './pages/Recruitment/Shortlisted';
import { KanbanPipelinePage } from './pages/Recruitment/Kanban';
import { QuestionBankPage } from './pages/Recruitment/QuestionBank';
import { ConfigurationHubPage } from './pages/settings/configuration/ConfigurationHubPage';
import { RolesPermissionsPage } from './pages/settings/configuration/RolesPermissionsPage';
import { UserManagementPage } from './pages/settings/configuration/UserManagementPage';
import { ApprovalWorkflowsPage } from './pages/settings/configuration/ApprovalWorkflowsPage';
import { NotificationTemplatesPage } from './pages/settings/configuration/NotificationTemplatesPage';
import { ScreeningCriteriaPage } from './pages/settings/configuration/ScreeningCriteriaPage';
import { EvaluationTemplatesPage } from './pages/settings/configuration/EvaluationTemplatesPage';
import { JobTemplatesPage } from './pages/settings/configuration/JobTemplatesPage';
import { InterviewCategoriesPage } from './pages/settings/configuration/InterviewCategoriesPage';
import { ChannelsSourcesPage } from './pages/settings/configuration/ChannelsSourcesPage';
import { CustomFieldsPage } from './pages/settings/configuration/CustomFieldsPage';
import { CompanyProfilePage } from './pages/settings/configuration/CompanyProfilePage';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
      Loading session…
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  const { user, loading } = useSession();

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/magic-link" element={<MagicLinkRequest />} />
        <Route path="/login/magic-link/callback" element={<MagicLinkCallbackPage />} />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
        />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route
          path="/verify-email/pending"
          element={
            <EmailVerificationPending
              email={new URLSearchParams(window.location.search).get('email') || ''}
              userType="user"
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            element={
              <RoleGuard>
                <Outlet />
              </RoleGuard>
            }
          >
            <Route index element={<DashboardHomePage />} />
            {/* Legacy route: keep URL stable, but dashboard is now unified */}
            <Route path="candidate" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="workforce-planning"
              element={<WorkforcePlanningListPage />}
            />
            <Route
              path="workforce-planning/create"
              element={<WorkforcePlanningCreatePage />}
            />
            <Route
              path="workforce-planning/:id/edit"
              element={<WorkforcePlanningCreatePage />}
            />
            <Route
              path="recruitment-requests"
              element={<RecruitmentRequestListPage />}
            />
            <Route
              path="recruitment-requests/create"
              element={<RecruitmentRequestCreatePage />}
            />
            <Route
              path="recruitment-requests/edit/:id"
              element={<RecruitmentRequestCreatePage />}
            />
            <Route path="vacancies" element={<VacancyHub />} />
            <Route path="vacancies/:vacancyId" element={<VacancyHub />} />
            <Route path="vacancies/:vacancyId/evaluation" element={<VacancyHub />} />
            <Route path="vacancies/:vacancyId/hiring-minute" element={<VacancyHub />} />
            <Route path="interviews/:interviewId/evaluate" element={<EvaluateInterviewPage />} />
            <Route path="screening" element={<ScreeningPage />} />
            <Route
              path="applications"
              element={<CandidateApplicationsPage />}
            />
            <Route
              path="applications/:id"
              element={<ApplicationDetailPage />}
            />
            <Route path="job-search" element={<CandidateJobSearchPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
            <Route path="notifications" element={<StaffNotificationsPage />} />
            <Route path="settings" element={<HRSettingsPage />} />
            <Route path="candidate-offers" element={<CandidateOffersPage />} />
            <Route path="candidate-interviews" element={<CandidateInterviewsPage />} />
            <Route path="candidate-settings" element={<CandidateSettingsPage />} />
            <Route path="candidate-notifications" element={<CandidateNotificationsPage />} />
            <Route
              path="settings/configuration/roles-permissions"
              element={<Navigate to="/dashboard/configuration" replace />}
            />
            <Route path="configuration" element={<ConfigurationHubPage />} />
            <Route
              path="configuration/user-management"
              element={<UserManagementPage />}
            />
            <Route
              path="configuration/roles-permissions"
              element={<RolesPermissionsPage />}
            />
            <Route
              path="configuration/approval-workflows"
              element={<ApprovalWorkflowsPage />}
            />
            <Route
              path="configuration/notification-templates"
              element={<NotificationTemplatesPage />}
            />
            <Route
              path="configuration/screening-criteria"
              element={<ScreeningCriteriaPage />}
            />
            <Route
              path="configuration/evaluation-templates"
              element={<EvaluationTemplatesPage />}
            />
            <Route
              path="configuration/job-templates"
              element={<JobTemplatesPage />}
            />
            <Route
              path="configuration/interview-categories"
              element={<InterviewCategoriesPage />}
            />
            <Route
              path="configuration/channels-sources"
              element={<ChannelsSourcesPage />}
            />
            <Route
              path="configuration/custom-fields"
              element={<CustomFieldsPage />}
            />
            <Route
              path="configuration/company-profile"
              element={<CompanyProfilePage />}
            />
            <Route path="offers" element={<OfferListPage />} />
            <Route path="roster" element={<TalentPoolPage />} />
            <Route path="interviews" element={<InterviewListPage />} />
            <Route path="shortlisted" element={<ShortlistedPage />} />
            <Route path="kanban" element={<KanbanPipelinePage />} />
            <Route path="question-bank" element={<QuestionBankPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
};
