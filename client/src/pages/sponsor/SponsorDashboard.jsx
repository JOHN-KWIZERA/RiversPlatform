import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Star, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { analyticsApi, donationApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../lib/utils';

export default function SponsorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.sponsor(),
      donationApi.getMy(),
    ])
      .then(([analyticsData, donationsData]) => {
        setAnalytics(analyticsData);
        setDonations(Array.isArray(donationsData) ? donationsData.slice(0, 8) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.organisation ? `${user.organisation} · ` : ''}Making an impact across Rwanda</p>
        </div>
        <Button variant="primary" leftIcon={<Star size={16} />} onClick={() => navigate('/dashboard/browse')}>
          Browse Campaigns
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Given"           value={formatCurrency(analytics?.totalGiven ?? 0)}          icon={Heart}      iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Campaigns Supported"   value={analytics?.campaignsSupported ?? 0}                  icon={Star}       iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Total Donations"       value={analytics?.totalDonations ?? 0}                      icon={Users}      iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Avg. Donation"         value={analytics?.totalDonations ? formatCurrency(Math.round((analytics.totalGiven ?? 0) / analytics.totalDonations)) : '—'} icon={TrendingUp} iconColor="text-forest-500" iconBg="bg-forest-50" />
          </div>

          {/* Impact summary */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 text-base mb-0.5">Your Impact This Year</h3>
            <p className="text-gray-400 text-sm mb-5">Thank you for supporting communities across Kigali.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Donated',    value: formatCurrency(analytics?.totalGiven ?? 0) },
                { label: 'Campaigns',  value: analytics?.campaignsSupported ?? 0 },
                { label: 'Donations',  value: analytics?.totalDonations ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-lg font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent donations table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#001E2B]">{t('dashboard.recent_donations')}</h3>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/donations')}>
                View all
              </Button>
            </div>
            {donations.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400 mb-3">No donations yet.</p>
                <Button size="sm" onClick={() => navigate('/dashboard/browse')}>Browse campaigns</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Campaign</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">When</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donations.map((d) => (
                      <tr key={d._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-[#001E2B] truncate max-w-xs">
                            {d.campaignId?.title || 'Campaign'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-gray-400">{timeAgo(d.donatedAt || d.createdAt)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-brand-600">{formatCurrency(d.amount)}</span>
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
