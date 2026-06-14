import { useAuth } from '../context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import LeaderDashboard from './leader/LeaderDashboard';
import SponsorDashboard from './sponsor/SponsorDashboard';
import VolunteerDashboard from './volunteer/VolunteerDashboard';
import BeneficiaryDashboard from './beneficiary/BeneficiaryDashboard';
import Spinner from '../components/ui/Spinner';

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} className="text-brand-500" />
    </div>
  );

  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'community_leader': return <LeaderDashboard />;
    case 'sponsor': return <SponsorDashboard />;
    case 'volunteer': return <VolunteerDashboard />;
    case 'beneficiary': return <BeneficiaryDashboard />;
    default: return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">👋</p>
        <h2 className="text-xl font-bold text-[#1a1a2e]">Welcome to RIVERS</h2>
        <p className="text-gray-500 mt-2">Your dashboard is being set up…</p>
      </div>
    );
  }
}
