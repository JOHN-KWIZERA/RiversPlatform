import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Calendar, Briefcase, Edit2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, effectiveRole } = useAuth();
  const [opp, setOpp] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
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
      setHasApplied(appList.some(a => {
        const oppId = a.opportunityId?._id || a.opportunityId;
        return oppId === id || oppId?.toString() === id;
      }));
    }).catch(() => {
      toast.error('Opportunity not found.');
      navigate('/dashboard/opportunities');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>;
  }
  if (!opp) return null;

  const slotsLeft = opp.slots - (opp.filledSlots || 0);
  const canApply = !isManager && opp.status === 'open' && slotsLeft > 0 && !hasApplied;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/opportunities')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Opportunities
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`badge ${
                opp.status === 'open' ? 'bg-forest-50 text-forest-700' :
                opp.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                'bg-red-50 text-red-500'
              }`}>
                {opp.status}
              </span>
              <span className={`text-sm font-semibold ${slotsLeft > 0 ? 'text-forest-600' : 'text-red-400'}`}>
                {slotsLeft > 0 ? `${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} remaining` : 'Fully booked'}
              </span>
            </div>
            <h1 className="page-header">{opp.title}</h1>
          </div>

          <div className="flex gap-2 flex-shrink-0 mt-1">
            {isManager && (
              <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />}
                onClick={() => navigate('/dashboard/opportunities')}>
                Manage
              </Button>
            )}
            {canApply && (
              <Button onClick={() => navigate(`/dashboard/opportunities/${id}/apply`)}>
                Apply Now
              </Button>
            )}
            {hasApplied && !isManager && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold bg-forest-50 text-forest-700 border border-forest-200">
                Applied ✓
              </span>
            )}
            {!isManager && opp.status !== 'open' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm text-gray-400">
                Applications closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="card p-5 flex flex-wrap gap-x-8 gap-y-4">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center">
            <MapPin size={15} className="text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Location</p>
            <p className="font-medium text-[#001E2B]">{opp.community}{opp.district && `, ${opp.district}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center">
            <Calendar size={15} className="text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Start Date</p>
            <p className="font-medium text-[#001E2B]">{opp.startDate ? formatDate(opp.startDate) : '—'}</p>
          </div>
        </div>

        {opp.endDate && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center">
              <Clock size={15} className="text-brand-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">End Date</p>
              <p className="font-medium text-[#001E2B]">{formatDate(opp.endDate)}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-sm">
          <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center">
            <Users size={15} className="text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Capacity</p>
            <p className="font-medium text-[#001E2B]">{opp.filledSlots || 0} / {opp.slots} filled</p>
          </div>
        </div>

        {opp.createdBy?.fullName && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center">
              <Briefcase size={15} className="text-brand-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Organized by</p>
              <p className="font-medium text-[#001E2B]">{opp.createdBy.fullName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      {opp.skills?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#001E2B] mb-3">Skills Needed</h3>
          <div className="flex flex-wrap gap-2">
            {opp.skills.map(s => (
              <span key={s} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-sm text-sm font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-[#001E2B] mb-3">About this Opportunity</h3>
        <div className="prose-content text-gray-600" dangerouslySetInnerHTML={{ __html: opp.description }} />
      </div>

      {/* Apply CTA banner — only for eligible volunteers */}
      {canApply && (
        <div className="rounded-xl p-6 bg-gradient-to-br from-[#001E2B] to-[#023430] text-white flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-lg">Ready to make an impact?</h3>
            <p className="text-[#889397] text-sm mt-0.5">
              Join {opp.community} and contribute your skills to this initiative.
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
  );
}
