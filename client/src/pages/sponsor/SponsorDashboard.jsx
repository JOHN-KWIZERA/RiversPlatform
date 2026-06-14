import { useTranslation } from 'react-i18next';
import { Heart, Star, Users, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Avatar from '../../components/ui/Avatar';
import { MOCK_CAMPAIGNS, formatCurrency, progressPercent, categoryColor, timeAgo } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const MOCK_DONATIONS = [
  { campaign: 'School Supplies for Bumbogo', amount: 50000, date: new Date(Date.now() - 2 * 86400000), status: 'completed' },
  { campaign: 'Youth Digital Skills Bootcamp', amount: 100000, date: new Date(Date.now() - 8 * 86400000), status: 'completed' },
  { campaign: 'Medical Support – Kimironko', amount: 75000, date: new Date(Date.now() - 20 * 86400000), status: 'completed' },
];

export default function SponsorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const featured = MOCK_CAMPAIGNS.filter((c) => c.status === 'active').slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.organisation ? `${user.organisation} · ` : ''}Making an impact across Rwanda</p>
        </div>
        <Button variant="primary" leftIcon={<Star size={16} />} onClick={() => navigate('/dashboard/browse')}>
          Browse Campaigns
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Given" value="RWF 225K" icon={Heart} trend={33} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Campaigns Supported" value="3" icon={Star} trend={50} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Families Reached" value="185" icon={Users} trend={22} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Impact Score" value="94/100" icon={TrendingUp} trend={8} iconColor="text-forest-500" iconBg="bg-forest-50" />
      </div>

      {/* Impact summary card */}
      <div className="card p-6 bg-gradient-to-br from-forest-500 to-forest-700 text-white">
        <h3 className="font-bold text-lg mb-1">Your Impact This Year</h3>
        <p className="text-forest-100 text-sm mb-5">Thank you for supporting communities across Kigali.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Donated', value: 'RWF 225,000' },
            { label: 'Families helped', value: '185' },
            { label: 'Youth employed', value: '12' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-lg font-black">{value}</p>
              <p className="text-xs text-forest-100 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent donations */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a1a2e]">{t('dashboard.recent_donations')}</h3>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/donations')}>View all</Button>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {MOCK_DONATIONS.map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-forest-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{d.campaign}</p>
                  <p className="text-xs text-gray-400">{timeAgo(d.date)}</p>
                </div>
                <span className="text-sm font-bold text-forest-700">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested campaigns */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a1a2e]">Suggested for You</h3>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/browse')}>Explore</Button>
          </div>
          <div className="flex flex-col gap-3">
            {featured.slice(0, 3).map((c) => {
              const pct = progressPercent(c.raisedAmount, c.targetAmount);
              return (
                <div key={c._id} className="flex gap-3 cursor-pointer hover:bg-brand-50/50 rounded-xl p-2 -m-2 transition-colors" onClick={() => navigate(`/campaigns/${c._id}`)}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-brand-100">
                    {c.coverImage ? <img src={c.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🌍</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a2e] truncate">{c.title}</p>
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
    </div>
  );
}
