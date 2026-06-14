import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Star, Users, TrendingUp, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Spinner from '../../components/ui/Spinner';
import { campaignApi, analyticsApi, donationApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, progressPercent, timeAgo } from '../../lib/utils';

export default function SponsorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.sponsor(),
      campaignApi.getAll({ status: 'active', limit: 4 }),
      donationApi.getMy(),
    ])
      .then(([analyticsData, campaignsData, donationsData]) => {
        setAnalytics(analyticsData);
        setSuggested(campaignsData.campaigns || []);
        setDonations(Array.isArray(donationsData) ? donationsData.slice(0, 3) : []);
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
          <div className="card p-6 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white border-0">
            <h3 className="font-bold text-lg mb-1">Your Impact This Year</h3>
            <p className="text-[#889397] text-sm mb-5">Thank you for supporting communities across Kigali.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Donated',    value: formatCurrency(analytics?.totalGiven ?? 0) },
                { label: 'Campaigns',  value: analytics?.campaignsSupported ?? 0 },
                { label: 'Donations',  value: analytics?.totalDonations ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-md p-3 text-center border border-white/[0.07]">
                  <p className="text-lg font-black">{value}</p>
                  <p className="text-xs text-[#889397] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent donations */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#001E2B]">{t('dashboard.recent_donations')}</h3>
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/donations')}>View all</Button>
              </div>
              {donations.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No donations yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {donations.map((d) => (
                    <div key={d._id} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={16} className="text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#001E2B] truncate">{d.campaignId?.title || 'Campaign'}</p>
                        <p className="text-xs text-gray-400">{timeAgo(d.donatedAt || d.createdAt)}</p>
                      </div>
                      <span className="text-sm font-bold text-brand-600">{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested campaigns */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#001E2B]">Suggested for You</h3>
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/browse')}>Explore</Button>
              </div>
              <div className="flex flex-col gap-3">
                {suggested.slice(0, 3).map((c) => {
                  const pct = progressPercent(c.raisedAmount, c.targetAmount);
                  return (
                    <div key={c._id} className="flex gap-3 cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors" onClick={() => navigate(`/campaigns/${c._id}`)}>
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-brand-50">
                        {c.coverImage
                          ? <img src={c.coverImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Globe size={18} className="text-brand-200" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#001E2B] truncate">{c.title}</p>
                        <Progress value={pct} size="sm" className="mt-1.5" />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span className="font-semibold text-brand-600">{pct}% funded</span>
                          <span>{c.donorCount} donors</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
