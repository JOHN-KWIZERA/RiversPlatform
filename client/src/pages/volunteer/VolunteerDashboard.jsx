import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake, Award, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/analytics/StatsCard';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { opportunityApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function VolunteerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myApps, setMyApps] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      opportunityApi.getAll({ status: 'open', limit: 1 }),
      opportunityApi.getMyApplications().catch(() => []),
    ]).then(([oppData, apps]) => {
      setOpenCount(oppData.total ?? 0);
      setMyApps(Array.isArray(apps) ? apps : []);
    }).finally(() => setLoading(false));
  }, []);

  const accepted = myApps.filter(a => a.status === 'accepted');
  const pending  = myApps.filter(a => a.status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Your volunteer contributions make Rwanda stronger.</p>
        </div>
        <Button rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/opportunities')}>
          Browse Opportunities
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Open Opportunities" value={openCount}        icon={Handshake}    iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Applications Sent"  value={myApps.length}   icon={CheckCircle2} iconColor="text-forest-500" iconBg="bg-forest-50" />
            <StatsCard label="Accepted"           value={accepted.length} icon={Award}        iconColor="text-brand-500"  iconBg="bg-brand-50" />
            <StatsCard label="Pending Response"   value={pending.length}  icon={Clock}        iconColor="text-amber-600"  iconBg="bg-amber-50" />
          </div>

          {/* Certificate progress */}
          <div className="card p-6 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white border-0 flex items-center gap-5">
            <div className="w-14 h-14 rounded-md bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
              <Award size={28} className="text-[#00ED64]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Community Impact Certificate</h3>
              <p className="text-[#889397] text-sm mt-0.5">Complete 40 volunteer hours to earn your certificate of recognition.</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-brand-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, (accepted.length / 5) * 100)}%` }} />
              </div>
              <p className="text-xs text-[#889397] mt-1">{accepted.length} of 5 accepted assignments</p>
            </div>
          </div>

          {/* My applications table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#001E2B]">My Applications</h3>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate('/dashboard/opportunities')}>
                Browse more
              </Button>
            </div>
            {myApps.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">No applications yet.</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/dashboard/opportunities')}>
                  Find an opportunity
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Opportunity</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Start date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myApps.map((app) => {
                      const opp = app.opportunityId;
                      if (!opp) return null;
                      return (
                        <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[#001E2B] truncate max-w-xs">{opp.title || '—'}</p>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <span className="text-xs text-gray-500">{opp.community || '—'}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-xs text-gray-500">
                              {opp.startDate ? formatDate(opp.startDate) : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge text-[10px] ${
                              app.status === 'accepted'  ? 'bg-forest-50 text-forest-700' :
                              app.status === 'rejected'  ? 'bg-red-50 text-red-500' :
                              app.status === 'withdrawn' ? 'bg-gray-100 text-gray-500' :
                              'bg-amber-50 text-amber-700'
                            }`}>{app.status}</span>
                          </td>
                        </tr>
                      );
                    })}
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
