import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Users, Heart, TrendingUp, Clock, CheckCircle2, XCircle, Globe, Handshake, UserCheck } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import { DonationAreaChart, CategoryPieChart, StatusDistributionChart, UserGrowthLineChart } from '../../components/analytics/Charts';
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
            <StatsCard label="Active Sponsors"      value={analytics?.users?.activeSponsorCount ?? '—'} icon={UserCheck}  iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Families Supported"   value={analytics?.familiesSupported ?? '—'}       icon={Handshake}    iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Campaign Success Rate" value={analytics?.campaigns?.successRate != null ? `${analytics.campaigns.successRate}%` : '—'} icon={TrendingUp} iconColor="text-brand-500" iconBg="bg-brand-50" />
          </div>

          {/* Charts row 1 */}
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

          {/* Charts row 2 */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold text-[#001E2B] mb-1">Campaign Status Breakdown</h3>
              <p className="text-xs text-gray-400 mb-4">Count of campaigns by current status</p>
              {(analytics?.charts?.campaignsByStatus?.length > 0)
                ? <StatusDistributionChart data={analytics.charts.campaignsByStatus} />
                : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet.</div>
              }
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-[#001E2B] mb-1">User Registrations</h3>
              <p className="text-xs text-gray-400 mb-4">New users joining per month</p>
              {(analytics?.charts?.monthlyUsers?.length > 0)
                ? <UserGrowthLineChart data={analytics.charts.monthlyUsers} />
                : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No registration data yet.</div>
              }
            </div>
          </div>

          {/* Pending campaigns table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#001E2B]">Campaigns Needing Review</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/campaigns')}>View all</Button>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No campaigns pending review.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Campaign</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pending.map((campaign) => (
                      <tr key={campaign._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-brand-50 overflow-hidden flex-shrink-0">
                              {campaign.coverImage
                                ? <img src={campaign.coverImage} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Globe size={16} className="text-brand-300" /></div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#001E2B] truncate max-w-xs">{campaign.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{campaign.community}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-gray-500">{t(`categories.${campaign.category}`)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`badge text-[10px] ${statusColor(campaign.status)}`}>{t(`status.${campaign.status}`)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => navigate('/dashboard/campaigns')}
                              className="p-1.5 rounded-md bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors"
                              title="Review & approve"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => navigate('/dashboard/campaigns')}
                              className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
