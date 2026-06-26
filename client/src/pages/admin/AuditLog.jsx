import { useState, useEffect } from 'react';
import { ShieldCheck, User, Megaphone, Heart, CheckCircle2, XCircle, LogIn, Clock, Ban, UserX, UserCog } from 'lucide-react';
import { auditApi } from '../../lib/api';
import Spinner from '../../components/ui/Spinner';
import { timeAgo } from '../../lib/utils';

const ACTION_META = {
  campaign_created:               { icon: Megaphone,    color: 'text-brand-500 bg-brand-50',    label: 'Campaign Created' },
  campaign_updated:               { icon: Megaphone,    color: 'text-amber-600 bg-amber-50',    label: 'Campaign Updated' },
  campaign_approved:              { icon: CheckCircle2, color: 'text-forest-600 bg-forest-50',  label: 'Campaign Approved' },
  campaign_rejected:              { icon: XCircle,      color: 'text-red-500 bg-red-50',        label: 'Campaign Rejected' },
  donation_created:               { icon: Heart,        color: 'text-brand-500 bg-brand-50',    label: 'Donation Received' },
  user_registered:                { icon: User,         color: 'text-forest-500 bg-forest-50',  label: 'User Registered' },
  user_verified:                  { icon: ShieldCheck,  color: 'text-forest-600 bg-forest-50',  label: 'User Verified' },
  opportunity_created:            { icon: ShieldCheck,  color: 'text-brand-500 bg-brand-50',    label: 'Opportunity Created' },
  beneficiary_assistance_added:   { icon: Heart,        color: 'text-forest-500 bg-forest-50',  label: 'Assistance Added' },
  beneficiary_progress_added:     { icon: CheckCircle2, color: 'text-brand-500 bg-brand-50',    label: 'Progress Added' },
  login:                          { icon: LogIn,        color: 'text-gray-500 bg-gray-100',     label: 'Login' },
  role_changed:                   { icon: UserCog,      color: 'text-blue-500 bg-blue-50',      label: 'Role Changed' },
  user_suspended:                 { icon: Ban,          color: 'text-amber-600 bg-amber-50',    label: 'User Suspended' },
  user_deleted:                   { icon: UserX,        color: 'text-red-500 bg-red-50',        label: 'User Deleted' },
};
const DEFAULT_META = { icon: Clock, color: 'text-gray-400 bg-gray-100', label: 'Event' };

const ACTIONS = ['all', ...Object.keys(ACTION_META)];

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 50 };
    if (filter !== 'all') params.action = filter;
    auditApi.getAll(params)
      .then(({ logs: list, total: t }) => { setLogs(list); setTotal(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">Full history of all platform actions — {total} events recorded.</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'campaign_created', 'campaign_approved', 'campaign_rejected', 'donation_created', 'user_verified', 'role_changed', 'user_suspended', 'user_deleted'].map((a) => (
          <button
            key={a}
            onClick={() => { setFilter(a); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === a ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            }`}
          >
            {a === 'all' ? 'All Events' : (ACTION_META[a]?.label || a)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} className="text-brand-500" /></div>
      ) : logs.length === 0 ? (
        <div className="card p-10 text-center">
          <ShieldCheck size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No audit events found.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="flex flex-col divide-y divide-gray-100">
            {logs.map((log) => {
              const { icon: Icon, color, label } = ACTION_META[log.action] || DEFAULT_META;
              return (
                <div key={log._id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#001E2B]">{label}</span>
                      {log.targetLabel && (
                        <span className="text-xs text-gray-500 truncate max-w-xs">— {log.targetLabel}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      By <strong>{log.actorName || 'Unknown'}</strong>
                      {log.ip && ` · ${log.ip}`}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(log.createdAt)}</span>
                </div>
              );
            })}
          </div>

          {total > 50 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Page {page} · {total} total</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
