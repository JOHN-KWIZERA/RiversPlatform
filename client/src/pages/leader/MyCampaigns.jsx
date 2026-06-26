import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Eye, MapPin, Globe, Megaphone, Archive, ArchiveRestore, Receipt, ClipboardList, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { campaignApi } from '../../lib/api';
import { formatCurrency, progressPercent, statusColor } from '../../lib/utils';

export default function MyCampaigns() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    campaignApi.getMy({ archived: tab === 'archived' })
      .then(data => setCampaigns(Array.isArray(data) ? data : data.campaigns || []))
      .catch(() => toast.error('Failed to load your campaigns.'))
      .finally(() => setLoading(false));
  }, [tab]);

  const handleArchive = async (c) => {
    try {
      await campaignApi.archive(c._id);
      setCampaigns(prev => prev.filter(x => x._id !== c._id));
      toast.success(`"${c.title}" archived.`);
    } catch {
      toast.error('Failed to archive campaign.');
    }
  };

  const handleUnarchive = async (c) => {
    try {
      await campaignApi.unarchive(c._id);
      setCampaigns(prev => prev.filter(x => x._id !== c._id));
      toast.success(`"${c.title}" restored.`);
    } catch {
      toast.error('Failed to restore campaign.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.campaigns')}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your community campaigns.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/dashboard/campaigns/new')}>
          New Campaign
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {['active', 'archived'].map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === tabKey
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tabKey === 'archived' ? 'Archived' : 'Active'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card p-12 text-center">
          {tab === 'archived' ? (
            <>
              <Archive size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No archived campaigns yet.</p>
            </>
          ) : (
            <>
              <Megaphone size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No campaigns yet. Create your first one to start raising funds for your community.</p>
              <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => navigate('/dashboard/campaigns/new')}>
                Create first campaign
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const pct = progressPercent(c.raisedAmount, c.targetAmount);
            return (
              <div key={c._id} className="card flex flex-col overflow-hidden group hover:border-gray-300 transition-all duration-200">
                <div className="h-44 bg-gradient-to-br from-brand-50 to-[#e8f5ef] overflow-hidden relative flex-shrink-0">
                  {c.coverImage ? (
                    <img src={c.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe size={36} className="text-brand-200" />
                    </div>
                  )}
                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`badge ${statusColor(c.status)}`}>{t(`status.${c.status}`)}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] text-white/80 font-medium">
                    <MapPin size={9} /> {c.community}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="font-bold text-sm text-[#001E2B] line-clamp-2">{c.title}</h3>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-brand-600">{formatCurrency(c.raisedAmount)}</span>
                      <span className="text-gray-400 font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #00684A 0%, #00A35C 60%, #00ED64 100%)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">of {formatCurrency(c.targetAmount)} goal</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 mt-auto flex-wrap">
                    {tab === 'active' ? (
                      <>
                        <Button variant="ghost" size="sm" leftIcon={<Eye size={13} />} className="flex-1 min-w-0" onClick={() => navigate(`/dashboard/campaigns/${c._id}`)}>
                          View
                        </Button>
                        <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />} className="flex-1 min-w-0" onClick={() => navigate(`/dashboard/campaigns/${c._id}/edit`)}>
                          Edit
                        </Button>
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${c._id}/expenditures`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
                          title="Log expenditures"
                        >
                          <Receipt size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${c._id}/beneficiaries`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
                          title="Beneficiary register"
                        >
                          <ClipboardList size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${c._id}/milestones`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
                          title="Disbursement milestones"
                        >
                          <Layers size={14} />
                        </button>
                        <button
                          onClick={() => handleArchive(c)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Archive campaign"
                        >
                          <Archive size={14} />
                        </button>
                      </>
                    ) : (
                      <Button variant="secondary" size="sm" leftIcon={<ArchiveRestore size={13} />} className="w-full" onClick={() => handleUnarchive(c)}>
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create new — only on active tab */}
          {tab === 'active' && (
            <button
              onClick={() => navigate('/dashboard/campaigns/new')}
              className="rounded-xl border-2 border-dashed border-brand-200 bg-white flex flex-col items-center justify-center p-8 gap-3 hover:border-brand-400 hover:bg-brand-50/40 transition-all min-h-48 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                <Plus size={24} className="text-brand-500" />
              </div>
              <div>
                <p className="font-bold text-brand-700">New Campaign</p>
                <p className="text-xs text-gray-400 mt-0.5">Create a verified community campaign</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
