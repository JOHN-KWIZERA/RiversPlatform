import { useTranslation } from 'react-i18next';
import { Heart, CheckCircle2, Clock, FileText, ArrowRight, BookOpen, Stethoscope, ShoppingBasket } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import Progress from '../../components/ui/Progress';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const SUPPORT_HISTORY = [
  { type: 'School Supplies', amount: 45000, date: 'Jan 2026', status: 'received', icon: BookOpen },
  { type: 'Medical Support', amount: 80000, date: 'Mar 2026', status: 'received', icon: Stethoscope },
  { type: 'Food Parcel – April', amount: 30000, date: 'Apr 2026', status: 'pending', icon: ShoppingBasket },
];

const ACTIVE_CAMPAIGNS = [
  { title: 'School Supplies – Term 2',  target: 150000, raised: 98000,  deadline: 'Jun 30, 2026' },
  { title: 'Medical Fund – Quarterly',  target: 200000, raised: 120000, deadline: 'Jul 15, 2026' },
];

export default function BeneficiaryDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">Your support history and upcoming assistance from your community leader.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="Total Support Received" value="RWF 155K" icon={Heart}        iconColor="text-brand-500"  iconBg="bg-brand-50" />
        <StatsCard label="Active Campaigns"        value="2"        icon={CheckCircle2} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Pending Support"         value="1"        icon={Clock}        iconColor="text-amber-600"  iconBg="bg-amber-50" />
      </div>

      {user?.isVerified && (
        <div className="card p-4 bg-brand-50 border border-brand-200 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-brand-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-brand-800 text-sm">Verified Beneficiary</p>
            <p className="text-xs text-brand-600">Your identity has been verified by your community leader. All support is documented and transparent.</p>
          </div>
        </div>
      )}

      {/* Active campaigns */}
      <div className="card p-5">
        <h3 className="font-semibold text-[#001E2B] mb-4">Campaigns Supporting You</h3>
        <div className="flex flex-col gap-4">
          {ACTIVE_CAMPAIGNS.map((c, i) => {
            const pct = Math.round((c.raised / c.target) * 100);
            return (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#001E2B]">{c.title}</p>
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
          <h3 className="font-semibold text-[#001E2B]">Support History</h3>
          <span className="text-xs text-gray-400">All transactions verified &amp; documented</span>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {SUPPORT_HISTORY.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#001E2B]">{s.type}</p>
                  <p className="text-xs text-gray-400">{s.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-forest-700">{formatCurrency(s.amount)}</p>
                  <span className={`text-xs font-semibold flex items-center gap-1 justify-end ${s.status === 'received' ? 'text-forest-600' : 'text-amber-600'}`}>
                    {s.status === 'received' ? <><CheckCircle2 size={11} /> Received</> : <><Clock size={11} /> Pending</>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact report */}
      <div className="card p-5 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-[#00ED64]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Your Community Impact Report</h3>
            <p className="text-sm text-[#889397] mt-0.5">See how donations to your campaigns have been used transparently.</p>
          </div>
          <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}
            className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 flex-shrink-0">
            View Report
          </Button>
        </div>
      </div>
    </div>
  );
}
