import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, MapPin, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export default function VolunteerOpportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      opportunityApi.getAll({ status: 'open' }),
      opportunityApi.getMyApplications().catch(() => []),
    ]).then(([oppData, apps]) => {
      setOpportunities(oppData.opportunities || []);
      const appList = Array.isArray(apps) ? apps : [];
      setAppliedIds(new Set(appList.map(a => a.opportunityId?._id || a.opportunityId)));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Volunteer Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? '' : `${opportunities.length} open ${opportunities.length === 1 ? 'opportunity' : 'opportunities'} available`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>
      ) : opportunities.length === 0 ? (
        <div className="card p-12 text-center">
          <Handshake size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No volunteer opportunities available right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {opportunities.map((opp) => {
            const slotsLeft = opp.slots - (opp.filledSlots || 0);
            const applied = appliedIds.has(opp._id);
            return (
              <div key={opp._id} className="card-hover p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="badge bg-brand-50 text-brand-700">{opp.community}</span>
                  <span className={`text-xs font-semibold ${slotsLeft > 0 ? 'text-forest-600' : 'text-red-400'}`}>
                    {slotsLeft > 0 ? `${slotsLeft} spots left` : 'Full'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#001E2B]">{opp.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{stripHtml(opp.description)}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={11} />{opp.district || opp.community}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatDate(opp.startDate)}</span>
                  </div>
                </div>
                {opp.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opp.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-sm text-xs">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/opportunities/${opp._id}`)}
                  >
                    View Details
                  </Button>
                  {applied ? (
                    <span className="flex-1 flex items-center justify-center text-xs font-semibold text-forest-600 bg-forest-50 rounded-md border border-forest-200">
                      Applied ✓
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={slotsLeft <= 0}
                      onClick={() => navigate(`/dashboard/opportunities/${opp._id}/apply`)}
                    >
                      {slotsLeft <= 0 ? 'Full' : 'Apply Now'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
