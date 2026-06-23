import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, CheckCircle2, Clock, FileText, ArrowRight, BookOpen, Stethoscope, ShoppingBasket, TrendingUp } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import Progress from '../../components/ui/Progress';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { beneficiaryApi } from '../../lib/api';
import { formatCurrency, formatDate, progressPercent } from '../../lib/utils';

const TYPE_ICON = { Education: BookOpen, Medical: Stethoscope, Food: ShoppingBasket };
const DEFAULT_ICON = Heart;

export default function BeneficiaryDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    beneficiaryApi.getMyProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalReceived = profile?.assistanceHistory?.reduce((s, a) => s + (a.amount || 0), 0) ?? 0;
  const enrolledCampaigns = profile?.enrolledCampaigns || [];
  const assistanceHistory = profile?.assistanceHistory || [];
  const progressUpdates = profile?.progressUpdates || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">Your support history and upcoming assistance from your community leader.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard label="Total Support Received" value={formatCurrency(totalReceived)} icon={Heart}        iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Campaigns Supporting Me" value={enrolledCampaigns.length}      icon={CheckCircle2} iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Progress Updates"        value={progressUpdates.length}         icon={TrendingUp}   iconColor="text-amber-600"  iconBg="bg-amber-50" />
          </div>

          {user?.isVerified && (
            <div className="card p-4 bg-brand-50 border border-brand-200 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-brand-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-brand-800 text-sm">Verified Beneficiary</p>
                <p className="text-xs text-brand-600">Your identity has been verified. All support is documented and transparent.</p>
              </div>
            </div>
          )}

          {/* Campaigns supporting this beneficiary */}
          {enrolledCampaigns.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-[#001E2B] mb-4">Campaigns Supporting You</h3>
              <div className="flex flex-col gap-4">
                {enrolledCampaigns.map((c) => {
                  const pct = progressPercent(c.raisedAmount, c.targetAmount);
                  return (
                    <div key={c._id} className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-[#001E2B]">{c.title}</p>
                        <span className={`badge text-[10px] ${c.status === 'active' ? 'bg-forest-50 text-forest-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                      </div>
                      <Progress value={pct} />
                      <div className="flex justify-between text-xs">
                        <span className="text-brand-600 font-semibold">{formatCurrency(c.raisedAmount || 0)} raised</span>
                        <span className="text-gray-400">{t('common.of')} {formatCurrency(c.targetAmount || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assistance history */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#001E2B]">Assistance History</h3>
              <span className="text-xs text-gray-400">Documented by your community leader</span>
            </div>
            {assistanceHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No assistance recorded yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {assistanceHistory.map((a) => {
                  const Icon = TYPE_ICON[a.type] || DEFAULT_ICON;
                  return (
                    <div key={a._id} className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#001E2B]">{a.type}</p>
                        <p className="text-xs text-gray-400">{a.description || ''} · {formatDate(a.date)}</p>
                      </div>
                      {a.amount > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-forest-700">{formatCurrency(a.amount)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress updates */}
          {progressUpdates.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-[#001E2B] mb-4">Progress Updates</h3>
              <div className="flex flex-col gap-3">
                {progressUpdates.map((u) => (
                  <div key={u._id} className="flex gap-3">
                    <div className="w-1.5 rounded-full bg-brand-300 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-[#001E2B]">{u.title}</p>
                      {u.notes && <p className="text-xs text-gray-500 mt-0.5">{u.notes}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(u.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile info */}
          <div className="card p-5">
            <h3 className="font-semibold text-[#001E2B] mb-3">My Profile</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Community', user?.community || '—'],
                ['District', profile?.district || '—'],
                ['Household Size', profile?.householdSize || '—'],
                ['Need Category', profile?.needsCategory?.replace('_', ' ') || '—'],
                ['Status', profile?.status || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-[#001E2B] capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
