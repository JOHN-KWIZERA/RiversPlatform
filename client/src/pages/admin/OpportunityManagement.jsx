import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, Users, Edit2, Eye, Handshake, Archive, ArchiveRestore } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function OpportunityManagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    opportunityApi.getAll({ status: 'all', limit: 50, archived: tab === 'archived' })
      .then(data => setOpportunities(data.opportunities || []))
      .catch(() => toast.error('Failed to load opportunities.'))
      .finally(() => setLoading(false));
  }, [tab]);

  const handleArchive = async (opp) => {
    try {
      await opportunityApi.archive(opp._id);
      setOpportunities(prev => prev.filter(o => o._id !== opp._id));
      toast.success(`"${opp.title}" archived.`);
    } catch {
      toast.error('Failed to archive opportunity.');
    }
  };

  const handleUnarchive = async (opp) => {
    try {
      await opportunityApi.unarchive(opp._id);
      setOpportunities(prev => prev.filter(o => o._id !== opp._id));
      toast.success(`"${opp.title}" restored.`);
    } catch {
      toast.error('Failed to restore opportunity.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Volunteer Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage opportunities for volunteers to apply to.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/dashboard/opportunities/new')}>
          New Opportunity
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {['active', 'archived'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'archived' ? 'Archived' : 'Active'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="card p-12 text-center">
          {tab === 'archived' ? (
            <>
              <Archive size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No archived opportunities yet.</p>
            </>
          ) : (
            <>
              <Handshake size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No volunteer opportunities yet. Create one to let volunteers apply.</p>
              <Button leftIcon={<Plus size={14} />} onClick={() => navigate('/dashboard/opportunities/new')}>
                Create first opportunity
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Start date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Slots</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.map((opp) => {
                  const slotsLeft = opp.slots - (opp.filledSlots || 0);
                  return (
                    <tr key={opp._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#001E2B] truncate max-w-xs">{opp.title}</p>
                        {opp.skills?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {opp.skills.slice(0, 3).map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{s}</span>
                            ))}
                            {opp.skills.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{opp.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={11} className="text-gray-400" /> {opp.community}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={11} className="text-gray-400" />
                          {opp.startDate ? formatDate(opp.startDate) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <span className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Users size={11} className="text-gray-400" />
                          {slotsLeft}/{opp.slots}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge text-[10px] ${
                          opp.status === 'open'      ? 'bg-forest-50 text-forest-700' :
                          opp.status === 'closed'    ? 'bg-gray-100 text-gray-500' :
                          'bg-red-50 text-red-500'
                        }`}>{opp.status}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-0.5 justify-end">
                          {tab === 'active' ? (
                            <>
                              <button
                                onClick={() => navigate(`/dashboard/opportunities/${opp._id}`)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="View"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => navigate(`/dashboard/opportunities/${opp._id}/edit`)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleArchive(opp)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Archive"
                              >
                                <Archive size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleUnarchive(opp)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Restore"
                            >
                              <ArchiveRestore size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
