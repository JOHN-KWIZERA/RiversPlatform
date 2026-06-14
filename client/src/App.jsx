import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';
import DashboardLayout from './components/layout/DashboardLayout';

const Landing = lazy(() => import('./pages/Landing'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CampaignApproval = lazy(() => import('./pages/admin/CampaignApproval'));
const CampaignsRouter = lazy(() => import('./pages/CampaignsRouter'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const LeaderDashboard = lazy(() => import('./pages/leader/LeaderDashboard'));
const CreateCampaign = lazy(() => import('./pages/leader/CreateCampaign'));
const SponsorDashboard = lazy(() => import('./pages/sponsor/SponsorDashboard'));
const BrowseCampaigns = lazy(() => import('./pages/sponsor/BrowseCampaigns'));
const VolunteerDashboard = lazy(() => import('./pages/volunteer/VolunteerDashboard'));
const BeneficiaryDashboard = lazy(() => import('./pages/beneficiary/BeneficiaryDashboard'));
const Settings = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size={36} className="text-brand-500" />
  </div>
);

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
          style: { fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#2d6a4f', secondary: 'white' } },
          error: { iconTheme: { primary: '#c45c26', secondary: 'white' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/campaigns" element={<Campaigns />} />

          {/* Auth */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

          {/* Dashboard (protected) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRouter />} />
            {/* Campaigns — role-aware */}
            <Route path="campaigns" element={<CampaignsRouter />} />
            <Route path="campaigns/new" element={<CreateCampaign />} />
            {/* Admin-only */}
            <Route path="users" element={<UserManagement />} />
            {/* Sponsor */}
            <Route path="browse" element={<BrowseCampaigns />} />
            {/* Settings – all roles */}
            <Route path="settings" element={<Settings />} />
            {/* Analytics placeholder */}
            <Route path="analytics" element={
              <div className="card p-10 text-center">
                <p className="text-4xl mb-4">📊</p>
                <h2 className="text-xl font-bold text-[#1a1a2e]">Analytics</h2>
                <p className="text-gray-500 mt-2">Full analytics dashboard coming in the next sprint.</p>
              </div>
            } />
            <Route path="reports" element={
              <div className="card p-10 text-center">
                <p className="text-4xl mb-4">📄</p>
                <h2 className="text-xl font-bold text-[#1a1a2e]">Impact Reports</h2>
                <p className="text-gray-500 mt-2">Report generation coming in the next sprint.</p>
              </div>
            } />
            <Route path="donations" element={
              <div className="card p-10 text-center">
                <p className="text-4xl mb-4">💛</p>
                <h2 className="text-xl font-bold text-[#1a1a2e]">My Donations</h2>
                <p className="text-gray-500 mt-2">Donation history coming in the next sprint.</p>
              </div>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
