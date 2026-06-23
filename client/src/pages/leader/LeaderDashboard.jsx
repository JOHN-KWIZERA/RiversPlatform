import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Heart, Users, Clock, Plus, ArrowRight, Edit2, Eye, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import { DonationAreaChart } from '../../components/analytics/Charts';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Spinner from '../../components/ui/Spinner';
import { campaignApi, analyticsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, progressPercent, statusColor } from '../../lib/utils';

export default function LeaderDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.leader(), campaignApi.getMy()])
      .then(([analyticsData, campaignsData]) => {
        setAnalytics(analyticsData);
        const list = Array.isArray(campaignsData) ? campaignsData : campaignsData.campaigns || [];
        setCampaigns(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest = campaigns[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Community: <strong>{user?.community || 'Your community'}</strong></p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/dashboard/campaigns/new')}>
          New Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label={t('dashboard.active_campaigns')} value={analytics?.activeCampaigns ?? 0} icon={Megaphone} iconColor="text-brand-500" iconBg="bg-brand-50" />
            <StatsCard label={t('dashboard.total_raised')} value={analytics?.totalRaised != null ? `RWF ${(analytics.totalRaised / 1_000_000).toFixed(1)}M` : '—'} icon={Heart} iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Total Donors" value={analytics?.totalDonors ?? 0} icon={Users} iconColor="text-brand-500" iconBg="bg-brand-50" />
            <StatsCard label={t('dashboard.pending_review')} value={(analytics?.totalCampaigns ?? 0) - (analytics?.activeCampaigns ?? 0)} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
          </div>

          {/* Two-column: latest campaign spotlight + chart */}
          {latest ? (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Spotlight — like Substack's "Latest post" widget */}
              <div className="card overflow-hidden flex flex-col">
                {latest.coverImage && (
                  <img src={latest.coverImage} alt={latest.title} className="w-full h-36 object-cover" />
                )}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                        {t(`categories.${latest.category}`)}
                      </p>
                      <h3 className="font-bold text-[#001E2B] leading-snug line-clamp-2">{latest.title}</h3>
                    </div>
                    <span className={`badge text-[10px] flex-shrink-0 ${statusColor(latest.status)}`}>
                      {t(`status.${latest.status}`)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={11} /> {latest.community}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Raised', value: `RWF ${Math.round((latest.raisedAmount || 0) / 1000)}K` },
                      { label: 'Donors', value: latest.donorCount ?? 0 },
                      { label: 'Progress', value: `${progressPercent(latest.raisedAmount, latest.targetAmount)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center bg-gray-50 rounded-md py-2">
                        <p className="text-sm font-bold text-[#001E2B]">{value}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <Progress value={progressPercent(latest.raisedAmount, latest.targetAmount)} size="sm" />
                  <div className="flex gap-2 mt-auto pt-1">
                    <Button variant="secondary" size="sm" className="flex-1" leftIcon={<Edit2 size={13} />}
                      onClick={() => navigate(`/dashboard/campaigns/${latest._id}/edit`)}>Edit</Button>
                    <Button size="sm" className="flex-1" leftIcon={<Eye size={13} />}
                      onClick={() => navigate(`/campaigns/${latest._id}`)}>View</Button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="card p-5 lg:col-span-2">
                <h3 className="font-semibold text-[#001E2B] mb-1">Fundraising activity</h3>
                <p className="text-xs text-gray-400 mb-4">Monthly donations across your campaigns</p>
                {analytics?.charts?.monthlyDonations?.length > 0 ? (
                  <DonationAreaChart data={analytics.charts.monthlyDonations.map(d => ({
                    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(d._id?.month ?? 1) - 1],
                    total: d.total,
                  }))} />
                ) : (
                  <div className="h-52 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-md">
                    Donation chart will appear once funds are received.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Megaphone size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-3">No campaigns yet.</p>
              <Button leftIcon={<Plus size={14} />} onClick={() => navigate('/dashboard/campaigns/new')}>
                Create your first campaign
              </Button>
            </div>
          )}

          {/* Campaigns table — replaces the card grid */}
          {campaigns.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-[#001E2B]">{t('dashboard.recent_campaigns')}</h3>
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate('/dashboard/campaigns')}>
                  {t('common.view_all')}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Campaign</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Raised</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Progress</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((c) => {
                      const pct = progressPercent(c.raisedAmount, c.targetAmount);
                      return (
                        <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[#001E2B] truncate max-w-xs">{c.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{c.community} · {t(`categories.${c.category}`)}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`badge text-[10px] ${statusColor(c.status)}`}>{t(`status.${c.status}`)}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                            <span className="text-sm font-semibold text-brand-600">
                              {formatCurrency(c.raisedAmount || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-20 h-1.5 rounded-full bg-gray-100">
                                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-0.5 justify-end">
                              <button
                                onClick={() => navigate(`/dashboard/campaigns/${c._id}/edit`)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => navigate(`/campaigns/${c._id}`)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="View public page"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
