import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Heart, Users, Clock, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import CampaignCard from '../../components/campaigns/CampaignCard';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { campaignApi, analyticsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function LeaderDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.leader(),
      campaignApi.getMy(),
    ])
      .then(([analyticsData, campaignsData]) => {
        setAnalytics(analyticsData);
        const list = Array.isArray(campaignsData) ? campaignsData : campaignsData.campaigns || [];
        setCampaigns(list.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Community: <strong>{user?.community || 'Your community'}</strong>
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/dashboard/campaigns/new')}>
          New Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label={t('dashboard.active_campaigns')}   value={analytics?.activeCampaigns ?? 0}  icon={Megaphone} iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label={t('dashboard.total_raised')}       value={analytics?.totalRaised != null ? `RWF ${(analytics.totalRaised/1000000).toFixed(1)}M` : '—'} icon={Heart} iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Total Donors"                      value={analytics?.totalDonors ?? 0}       icon={Users}     iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label={t('dashboard.pending_review')}     value={(analytics?.totalCampaigns ?? 0) - (analytics?.activeCampaigns ?? 0)} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-semibold text-[#001E2B] mb-1">Fundraising activity</h3>
              <p className="text-xs text-gray-400 mb-4">Monthly donations across your campaigns</p>
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-md">
                Donation chart will appear once funds are received.
              </div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white border-0">
              <h3 className="font-semibold mb-4">Campaign tips</h3>
              {[
                'Upload clear before/after photos for higher donor trust',
                'Set realistic goals — campaigns at 80%+ convert 3× faster',
                'Post weekly updates to keep sponsors engaged',
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 mb-3 last:mb-0">
                  <span className="w-5 h-5 rounded-sm bg-brand-500/30 text-[#00ED64] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="text-xs text-[#889397] leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#001E2B]">{t('dashboard.recent_campaigns')}</h3>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/campaigns')}>
                {t('common.view_all')}
              </Button>
            </div>
            {campaigns.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-sm text-gray-400">No campaigns yet.</p>
                <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} className="mt-3" onClick={() => navigate('/dashboard/campaigns/new')}>
                  Create your first campaign
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((c) => <CampaignCard key={c._id} campaign={c} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
