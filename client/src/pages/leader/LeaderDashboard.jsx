import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Heart, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import CampaignCard from '../../components/campaigns/CampaignCard';
import Button from '../../components/ui/Button';
import { MOCK_CAMPAIGNS, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { DonationAreaChart, MOCK_MONTHLY } from '../../components/analytics/Charts';

export default function LeaderDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const myCampaigns = MOCK_CAMPAIGNS.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Community: <strong>{user?.community || 'Bumbogo, Gasabo'}</strong></p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/dashboard/campaigns/new')}>
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label={t('dashboard.active_campaigns')} value="3" icon={Megaphone} trend={50} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label={t('dashboard.total_raised')} value="RWF 2.1M" icon={Heart} trend={22} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label={t('dashboard.families_supported')} value="185" icon={Users} trend={18} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label={t('dashboard.pending_review')} value="1" icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Chart + tip */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-[#1a1a2e] mb-1">Fundraising activity</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly donations across your campaigns</p>
          <DonationAreaChart data={MOCK_MONTHLY} />
        </div>

        {/* Quick tips */}
        <div className="card p-5 bg-gradient-to-br from-brand-50 to-parchment flex flex-col gap-4">
          <h3 className="font-semibold text-[#1a1a2e]">Campaign tips</h3>
          {[
            'Upload clear before/after photos for higher donor trust',
            'Set realistic goals — campaigns at 80%+ convert 3× faster',
            'Post weekly updates to keep sponsors engaged',
          ].map((tip, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <p className="text-xs text-gray-600 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a1a2e]">{t('dashboard.recent_campaigns')}</h3>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/campaigns')}>
            {t('common.view_all')}
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCampaigns.map((c) => (
            <CampaignCard key={c._id} campaign={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
