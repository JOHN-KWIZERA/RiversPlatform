import { useAuth } from '../context/AuthContext';
import CampaignApproval from './admin/CampaignApproval';
import MyCampaigns from './leader/MyCampaigns';
import BrowseCampaigns from './sponsor/BrowseCampaigns';
import Spinner from '../components/ui/Spinner';

export default function CampaignsRouter() {
  const { user, effectiveRole, loading } = useAuth();
  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} className="text-brand-500" /></div>;

  switch (effectiveRole ?? user?.role) {
    case 'admin': return <CampaignApproval />;
    case 'community_leader': return <MyCampaigns />;
    case 'sponsor': return <BrowseCampaigns />;
    default: return <BrowseCampaigns />;
  }
}
