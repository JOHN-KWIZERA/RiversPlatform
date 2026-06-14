import { useTranslation } from 'react-i18next';
import { Heart, CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import Progress from '../../components/ui/Progress';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const SUPPORT_HISTORY = [
  { type: 'School Supplies', amount: 45000, date: 'Jan 2026', status: 'received', icon: '📚' },
  { type: 'Medical Support', amount: 80000, date: 'Mar 2026', status: 'received', icon: '🏥' },
  { type: 'Food Parcel – April', amount: 30000, date: 'Apr 2026', status: 'pending', icon: '🍚' },
];

const ACTIVE_CAMPAIGNS = [
  { title: 'School Supplies – Term 2', target: 150000, raised: 98000, deadline: 'Jun 30, 2026' },
  { title: 'Medical Fund – Quarterly', target: 200000, raised: 120000, deadline: 'Jul 15, 2026' },
];

export default function BeneficiaryDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]} 🏡</h1>
        <p className="text-sm text-gray-500 mt-1">Your support history and upcoming assistance from your community leader.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="Total Support Received" value="RWF 155K" icon={Heart} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Active Campaigns" value="2" icon={CheckCircle2} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Pending Support" value="1" icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Verified badge */}
      {user?.isVerified && (
        <div className="card p-4 bg-forest-50 border border-forest-200 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-forest-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-forest-800 text-sm">Verified Beneficiary</p>
            <p className="text-xs text-forest-600">Your identity has been verified by your community leader. All support is documented and transparent.</p>
          </div>
        </div>
      )}

      {/* Active campaigns */}
      <div className="card p-5">
        <h3 className="font-semibold text-[#1a1a2e] mb-4">Campaigns Supporting You</h3>
        <div className="flex flex-col gap-4">
          {ACTIVE_CAMPAIGNS.map((c, i) => {
            const pct = Math.round((c.raised / c.target) * 100);
            return (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1a1a2e]">{c.title}</p>
                  <span className="text-xs text-gray-400">Deadline: {c.deadline}</span>
                </div>
                <Progress value={pct} />
                <div className="flex justify-between text-xs">
                  <span className="text-brand-600 font-semibold">{formatCurrency(c.raised)} raised</span>
                  <span className="text-gray-400">{t('common.of')} {formatCurrency(c.target)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support history */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a1a2e]">Support History</h3>
          <span className="text-xs text-gray-400">All transactions are verified & documented</span>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {SUPPORT_HISTORY.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 text-xl">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a2e]">{s.type}</p>
                <p className="text-xs text-gray-400">{s.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-forest-700">{formatCurrency(s.amount)}</p>
                <span className={`text-xs font-semibold ${s.status === 'received' ? 'text-forest-600' : 'text-amber-600'}`}>
                  {s.status === 'received' ? '✓ Received' : '⏳ Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact report access */}
      <div className="card p-5 bg-gradient-to-r from-brand-50 to-parchment">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-brand-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#1a1a2e]">Your Community Impact Report</h3>
            <p className="text-sm text-gray-500 mt-0.5">See how donations to your campaigns have been used transparently.</p>
          </div>
          <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>View Report</Button>
        </div>
      </div>
    </div>
  );
}
