import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Users, Heart, TrendingUp, Clock, CheckCircle2, XCircle, Globe } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import { DonationAreaChart, CategoryPieChart } from '../../components/analytics/Charts';
import { formatCurrency, statusColor, timeAgo } from '../../lib/utils';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, campaignApi } from '../../lib/api';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.admin(),
      campaignApi.getAll({ status: 'pending_review', limit: 4 }),
    ])
      .then(([analyticsData, campaignsData]) => {
        setAnalytics(analyticsData);
        setPending(campaignsData.campaigns || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = analytics?.charts?.monthlyDonations?.map(item => ({
    month: MONTH_NAMES[(item._id?.month ?? 1) - 1],
    total: item.total,
  })) || [];

  const categoryData = analytics?.charts?.campaignsByCategory || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.overview')}</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview — last 30 days</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : (
        <>
          {/* Stats row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Campaigns"   value={analytics?.campaigns?.total ?? '—'}   icon={Megaphone}     iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Active Campaigns"  value={analytics?.campaigns?.active ?? '—'}  icon={CheckCircle2}  iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Pending Review"    value={analytics?.campaigns?.pending ?? '—'} icon={Clock}         iconColor="text-amber-600"  iconBg="bg-amber-50" />
            <StatsCard label="Total Raised"      value={formatCurrency(analytics?.donations?.totalAmount ?? 0)} icon={Heart} iconColor="text-brand-500" iconBg="bg-brand-50" />
          </div>

          {/* Stats row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Registered Users"     value={analytics?.users?.total ?? '—'}            icon={Users}        iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Completed Donations"  value={analytics?.donations?.count ?? '—'}        icon={TrendingUp}   iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Completed Campaigns"  value={analytics?.campaigns?.completed ?? '—'}    icon={CheckCircle2} iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Avg. per Campaign"    value={analytics?.campaigns?.total ? formatCurrency(Math.round((analytics?.donations?.totalAmount ?? 0) / analytics.campaigns.total)) : '—'} icon={TrendingUp} iconColor="text-brand-500" iconBg="bg-brand-50" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-semibold text-[#001E2B] mb-1">Monthly Donation Volume</h3>
              <p className="text-xs text-gray-400 mb-4">Total donations received per month (RWF)</p>
              {monthlyData.length > 0
                ? <DonationAreaChart data={monthlyData} />
                : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No donation data yet.</div>
              }
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-[#001E2B] mb-1">Campaigns by Category</h3>
              <p className="text-xs text-gray-400 mb-4">Distribution across impact areas</p>
              {categoryData.length > 0
                ? <CategoryPieChart data={categoryData} />
                : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet.</div>
              }
            </div>
          </div>

          {/* Pending campaigns */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#001E2B]">Campaigns Needing Review</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/campaigns')}>
                View all
              </Button>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No campaigns pending review.</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {pending.map((campaign) => (
                  <div key={campaign._id} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-md bg-brand-50 overflow-hidden flex-shrink-0">
                      {campaign.coverImage
                        ? <img src={campaign.coverImage} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Globe size={18} className="text-brand-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#001E2B] truncate">{campaign.title}</p>
                      <p className="text-xs text-gray-400">{campaign.community} · {t(`categories.${campaign.category}`)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${statusColor(campaign.status)}`}>{t(`status.${campaign.status}`)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => navigate('/dashboard/campaigns')} className="p-1.5 rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors" title="Approve">
                          <CheckCircle2 size={14} />
                        </button>
                        <button onClick={() => navigate('/dashboard/campaigns')} className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
