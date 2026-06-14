import { useTranslation } from 'react-i18next';
import { Megaphone, Users, Heart, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import { DonationAreaChart, CategoryPieChart, MOCK_MONTHLY, MOCK_CATEGORIES } from '../../components/analytics/Charts';
import { MOCK_CAMPAIGNS, formatCurrency, statusColor, timeAgo } from '../../lib/utils';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const PENDING = MOCK_CAMPAIGNS.filter((c) => c.status === 'pending_review' || c.status === 'active').slice(0, 4);

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="page-header">{t('dashboard.overview')}</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview — last 30 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Campaigns" value="85" icon={Megaphone} trend={12} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Active Campaigns" value="34" icon={CheckCircle2} trend={8} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Pending Review" value="7" icon={Clock} trend={-2} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard label="Total Raised" value="RWF 12.4M" icon={Heart} trend={18} iconColor="text-brand-500" iconBg="bg-brand-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Registered Users" value="1,842" icon={Users} trend={24} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Families Supported" value="1,247" icon={TrendingUp} trend={15} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Youth Employed" value="340" icon={CheckCircle2} trend={31} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Completed Campaigns" value="43" icon={CheckCircle2} trend={5} iconColor="text-brand-500" iconBg="bg-brand-50" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-[#1a1a2e] mb-1">Monthly Donation Volume</h3>
          <p className="text-xs text-gray-400 mb-4">Total donations received per month (RWF)</p>
          <DonationAreaChart data={MOCK_MONTHLY} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-[#1a1a2e] mb-1">Campaigns by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution across impact areas</p>
          <CategoryPieChart data={MOCK_CATEGORIES} />
        </div>
      </div>

      {/* Pending campaigns */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a1a2e]">Campaigns Needing Review</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/campaigns')}>
            View all
          </Button>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {PENDING.map((campaign) => (
            <div key={campaign._id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 overflow-hidden flex-shrink-0">
                {campaign.coverImage ? (
                  <img src={campaign.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🌍</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a2e] truncate">{campaign.title}</p>
                <p className="text-xs text-gray-400">{campaign.community} · {t(`categories.${campaign.category}`)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge ${statusColor(campaign.status)}`}>
                  {t(`status.${campaign.status}`)}
                </span>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors" title="Approve">
                    <CheckCircle2 size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
