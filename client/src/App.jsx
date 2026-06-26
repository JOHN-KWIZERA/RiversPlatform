import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BarChart2, FileText, Heart } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';
import DashboardLayout from './components/layout/DashboardLayout';

const Landing           = lazy(() => import('./pages/Landing'));
const Campaigns         = lazy(() => import('./pages/Campaigns'));
const CampaignDetail    = lazy(() => import('./pages/CampaignDetail'));
const About             = lazy(() => import('./pages/About'));
const Login             = lazy(() => import('./pages/auth/Login'));
const Signup            = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'));
const NotFound          = lazy(() => import('./pages/NotFound'));
const DashboardRouter   = lazy(() => import('./pages/DashboardRouter'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const CampaignApproval  = lazy(() => import('./pages/admin/CampaignApproval'));
const CampaignsRouter   = lazy(() => import('./pages/CampaignsRouter'));
const UserManagement    = lazy(() => import('./pages/admin/UserManagement'));
const LeaderDashboard   = lazy(() => import('./pages/leader/LeaderDashboard'));
const CreateCampaign    = lazy(() => import('./pages/leader/CreateCampaign'));
const EditCampaign           = lazy(() => import('./pages/leader/EditCampaign'));
const CampaignExpenditures   = lazy(() => import('./pages/leader/CampaignExpenditures'));
const BeneficiaryRegister    = lazy(() => import('./pages/leader/BeneficiaryRegister'));
const DisbursementMilestones = lazy(() => import('./pages/leader/DisbursementMilestones'));
const RecurringGiving        = lazy(() => import('./pages/sponsor/RecurringGiving'));
const SponsorDashboard  = lazy(() => import('./pages/sponsor/SponsorDashboard'));
const BrowseCampaigns   = lazy(() => import('./pages/sponsor/BrowseCampaigns'));
const VolunteerDashboard      = lazy(() => import('./pages/volunteer/VolunteerDashboard'));
const VolunteerOpportunities  = lazy(() => import('./pages/volunteer/VolunteerOpportunities'));
const BeneficiaryDashboard = lazy(() => import('./pages/beneficiary/BeneficiaryDashboard'));
const DonationsPage     = lazy(() => import('./pages/DonationsPage'));
const Settings          = lazy(() => import('./pages/Settings'));
const ReportsPage       = lazy(() => import('./pages/ReportsPage'));
const AuditLogPage           = lazy(() => import('./pages/admin/AuditLog'));
const OpportunityManagement  = lazy(() => import('./pages/admin/OpportunityManagement'));
const OpportunityDetail      = lazy(() => import('./pages/opportunities/OpportunityDetail'));
const OpportunityApply       = lazy(() => import('./pages/opportunities/OpportunityApply'));
const OpportunityApplicants  = lazy(() => import('./pages/opportunities/OpportunityApplicants'));
const OpportunityFormPage    = lazy(() => import('./pages/opportunities/OpportunityFormPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size={36} className="text-brand-500" />
  </div>
);

const ComingSoon = ({ icon: Icon, title, desc }) => (
  <div className="card p-10 text-center flex flex-col items-center gap-4 max-w-md mx-auto mt-4">
    <div className="w-14 h-14 rounded-md bg-brand-50 flex items-center justify-center">
      <Icon size={28} className="text-brand-400" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-[#001E2B]">{title}</h2>
      <p className="text-gray-500 mt-2 text-sm">{desc}</p>
    </div>
    <span className="px-3 py-1 bg-brand-50 text-brand-600 text-xs font-bold rounded-sm border border-brand-200">
      Coming next sprint
    </span>
  </div>
);

function OpportunitiesRouter() {
  const { user, effectiveRole } = useAuth();
  const role = effectiveRole ?? user?.role;
  if (role === 'admin' || role === 'community_leader') {
    return <Suspense fallback={<PageLoader />}><OpportunityManagement /></Suspense>;
  }
  return <Suspense fallback={<PageLoader />}><VolunteerOpportunities /></Suspense>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            borderRadius: '6px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
          },
          success: { iconTheme: { primary: '#00684A', secondary: 'white' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<Landing />} />
          <Route path="/campaigns"   element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/about"       element={<About />} />

          {/* Auth */}
          <Route path="/login"           element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup"          element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

          {/* Dashboard (protected) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRouter />} />

            {/* Campaigns — role-aware */}
            <Route path="campaigns"                      element={<CampaignsRouter />} />
            <Route path="campaigns/new"                  element={<CreateCampaign />} />
            <Route path="campaigns/:id"                  element={<CampaignDetail standalone={false} />} />
            <Route path="campaigns/:id/edit"             element={<EditCampaign />} />
            <Route path="campaigns/:id/expenditures"     element={<CampaignExpenditures />} />
            <Route path="campaigns/:id/beneficiaries"    element={<BeneficiaryRegister />} />
            <Route path="campaigns/:id/milestones"       element={<DisbursementMilestones />} />
            <Route path="recurring"                     element={<RecurringGiving />} />

            {/* Admin */}
            <Route path="users" element={<UserManagement />} />

            {/* Sponsor */}
            <Route path="browse"    element={<BrowseCampaigns />} />
            <Route path="donations" element={<DonationsPage />} />

            {/* Beneficiary */}
            <Route path="aid" element={<BeneficiaryDashboard />} />

            {/* All roles */}
            <Route path="settings" element={<Settings />} />

            {/* Placeholders — to be built */}
            <Route path="analytics" element={
              <ComingSoon icon={BarChart2} title="Analytics" desc="Full analytics dashboard with charts, trends, and exports coming in the next sprint." />
            } />
            <Route path="reports"                    element={<ReportsPage />} />
            <Route path="audit"                    element={<AuditLogPage />} />
            <Route path="opportunities"            element={<OpportunitiesRouter />} />
            <Route path="opportunities/new"        element={<OpportunityFormPage />} />
            <Route path="opportunities/:id"        element={<OpportunityDetail />} />
            <Route path="opportunities/:id/edit"   element={<OpportunityFormPage />} />
            <Route path="opportunities/:id/apply"       element={<OpportunityApply />} />
            <Route path="opportunities/:id/applicants"  element={<OpportunityApplicants />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
