import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, Users, Calendar, Briefcase,
  Edit2, Tag, CheckCircle2, ChevronRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-brand-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-[#001E2B] mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, effectiveRole } = useAuth();
  const [opp, setOpp] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = effectiveRole ?? user?.role;
  const isManager = role === 'admin' || role === 'community_leader';

  useEffect(() => {
    Promise.all([
      opportunityApi.getById(id),
      opportunityApi.getMyApplications().catch(() => []),
    ]).then(([oppData, apps]) => {
      setOpp(oppData);
      const appList = Array.isArray(apps) ? apps : [];
      const mine = appList.find(a => {
        const oppId = a.opportunityId?._id || a.opportunityId;
        return oppId === id || oppId?.toString() === id;
      });
      setMyApplication(mine || null);
    }).catch(() => {
      toast.error('Opportunity not found.');
      navigate('/dashboard/opportunities');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>;
  }
  if (!opp) return null;

  const slotsLeft   = opp.slots - (opp.filledSlots || 0);
  const filledPct   = Math.round(((opp.filledSlots || 0) / Math.max(opp.slots, 1)) * 100);
  const canApply    = !isManager && opp.status === 'open' && slotsLeft > 0 && !myApplication;
  const isOpen      = opp.status === 'open';

  const APP_STATUS = {
    pending:  { label: 'Under Review', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⏳' },
    accepted: { label: 'Accepted',     className: 'bg-forest-50 text-forest-700 border-forest-200', icon: '✓' },
    rejected: { label: 'Not Selected', className: 'bg-gray-100 text-gray-500 border-gray-200', icon: '✕' },
  };
  const appStatus = myApplication ? (APP_STATUS[myApplication.status] || APP_STATUS.pending) : null;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ──────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/dashboard/opportunities')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Opportunities
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`badge ${
                isOpen ? 'bg-forest-50 text-forest-700 border border-forest-200' :
                opp.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                'bg-red-50 text-red-500'
              }`}>
                {opp.status}
              </span>
              {opp.category && (
                <span className="badge bg-brand-50 text-brand-700">{opp.category.replace(/_/g, ' ')}</span>
              )}
              <span className={`text-sm font-semibold ${slotsLeft > 0 ? 'text-forest-600' : 'text-red-400'}`}>
                {slotsLeft > 0 ? `${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} remaining` : 'Fully booked'}
              </span>
            </div>
            <h1 className="page-header leading-tight">{opp.title}</h1>
          </div>

          {/* Action buttons in header */}
          <div className="flex gap-2 items-center flex-shrink-0 mt-1">
            {isManager && (
              <>
                <Button variant="secondary" size="sm" leftIcon={<Users size={13} />}
                  onClick={() => navigate(`/dashboard/opportunities/${id}/applicants`)}>
                  View Applicants
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />}
                  onClick={() => navigate(`/dashboard/opportunities/${id}/edit`)}>
                  Edit
                </Button>
              </>
            )}
            {canApply && (
              <Button size="sm" rightIcon={<ChevronRight size={14} />}
                onClick={() => navigate(`/dashboard/opportunities/${id}/apply`)}>
                Apply Now
              </Button>
            )}
            {appStatus && !isManager && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${appStatus.className}`}>
                {appStatus.icon} {appStatus.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">

        {/* ── Main column (2/3) ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Skills */}
          {opp.skills?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-xs font-bold text-[#001E2B] uppercase tracking-wider mb-3">
                Skills Needed
              </h3>
              <div className="flex flex-wrap gap-2">
                {opp.skills.map(s => (
                  <span
                    key={s}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card p-5">
            <h3 className="text-xs font-bold text-[#001E2B] uppercase tracking-wider mb-4">
              About this Opportunity
            </h3>
            <div
              className="prose-content text-gray-600 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: opp.description }}
            />
          </div>

          {/* Apply CTA banner — shown inline for mobile / eligible volunteers */}
          {canApply && (
            <div className="rounded-xl p-6 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white flex items-center justify-between gap-4 flex-wrap lg:hidden">
              <div>
                <h3 className="font-bold text-base">Ready to make an impact?</h3>
                <p className="text-[#889397] text-sm mt-0.5">
                  Join {opp.community} and contribute your skills.
                </p>
              </div>
              <Button
                className="bg-[#00ED64] text-[#001E2B] hover:bg-[#00c952] font-bold flex-shrink-0"
                onClick={() => navigate(`/dashboard/opportunities/${id}/apply`)}
              >
                Apply Now
              </Button>
            </div>
          )}
        </div>

        {/* ── Sidebar (1/3) ────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Key details */}
          <div className="card p-4">
            <h3 className="text-xs font-bold text-[#001E2B] uppercase tracking-wider mb-1">
              Details
            </h3>
            <div>
              <DetailRow
                icon={MapPin}
                label="Location"
                value={[opp.community, opp.district].filter(Boolean).join(', ') || '—'}
              />
              <DetailRow
                icon={Calendar}
                label="Start Date"
                value={opp.startDate ? formatDate(opp.startDate) : '—'}
              />
              {opp.endDate && (
                <DetailRow
                  icon={Clock}
                  label="End Date"
                  value={formatDate(opp.endDate)}
                />
              )}
              {opp.createdBy?.fullName && (
                <DetailRow
                  icon={Briefcase}
                  label="Organised by"
                  value={opp.createdBy.fullName}
                />
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#001E2B] uppercase tracking-wider">Capacity</h3>
              <span className={`text-xs font-bold ${slotsLeft > 0 ? 'text-forest-600' : 'text-red-500'}`}>
                {slotsLeft > 0 ? `${slotsLeft} open` : 'Full'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${filledPct}%`,
                  background: filledPct >= 100
                    ? '#ef4444'
                    : 'linear-gradient(90deg, #00684A 0%, #00A35C 60%, #00ED64 100%)',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={11} /> {opp.filledSlots || 0} filled
              </span>
              <span>{opp.slots} total spots</span>
            </div>
          </div>

          {/* Apply CTA sidebar card — desktop only */}
          {canApply && (
            <div className="hidden lg:block rounded-xl p-5 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white">
              <h3 className="font-bold text-base mb-1">Ready to help?</h3>
              <p className="text-[#889397] text-xs mb-4 leading-relaxed">
                Join {opp.community} and contribute your skills to this initiative.
              </p>
              <Button
                className="w-full bg-[#00ED64] text-[#001E2B] hover:bg-[#00c952] font-bold"
                onClick={() => navigate(`/dashboard/opportunities/${id}/apply`)}
              >
                Apply Now
              </Button>
            </div>
          )}

          {/* Application status sidebar card */}
          {appStatus && !isManager && (
            <div className={`hidden lg:flex card p-4 items-center gap-3 border ${appStatus.className}`}>
              <CheckCircle2 size={20} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">{appStatus.label}</p>
                <p className="text-xs mt-0.5 opacity-80">
                  {myApplication?.status === 'accepted'
                    ? 'The organizer will be in touch soon.'
                    : myApplication?.status === 'rejected'
                    ? 'Keep an eye out for other opportunities.'
                    : 'You\'ll be notified of any updates.'}
                </p>
              </div>
            </div>
          )}

          {/* Closed notice */}
          {!isManager && !isOpen && (
            <div className="hidden lg:block card p-4 text-center">
              <p className="text-sm text-gray-400 font-medium">Applications are closed</p>
            </div>
          )}

          {/* Manager actions */}
          {isManager && (
            <div className="hidden lg:flex card p-4 flex-col gap-2">
              <p className="text-xs font-bold text-[#001E2B] uppercase tracking-wider mb-1">Actions</p>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit2 size={13} />}
                className="w-full justify-center"
                onClick={() => navigate(`/dashboard/opportunities/${id}/edit`)}
              >
                Edit Opportunity
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-gray-500"
                onClick={() => navigate('/dashboard/opportunities')}
              >
                Back to List
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
