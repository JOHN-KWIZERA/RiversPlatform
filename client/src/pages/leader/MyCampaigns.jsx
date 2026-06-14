import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Eye, MapPin, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Spinner from '../../components/ui/Spinner';
import { campaignApi } from '../../lib/api';
import { formatCurrency, progressPercent, statusColor } from '../../lib/utils';

export default function MyCampaigns() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignApi.getMy()
      .then(data => setCampaigns(Array.isArray(data) ? data : data.campaigns || []))
      .catch(() => toast.error('Failed to load your campaigns.'))
      .finally(() => setLoading(false));
  }, []);

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const pct = progressPercent(c.raisedAmount, c.targetAmount);
            return (
              <div key={c._id} className="card flex flex-col overflow-hidden">
                <div className="h-36 bg-brand-50 overflow-hidden relative">
                  {c.coverImage ? (
                    <img src={c.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe size={32} className="text-brand-200" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`badge ${statusColor(c.status)}`}>{t(`status.${c.status}`)}</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="font-semibold text-sm text-[#001E2B] line-clamp-2">{c.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={10} /> {c.community}
                  </div>
                  <div>
                    <Progress value={pct} size="sm" />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="font-semibold text-brand-600">{formatCurrency(c.raisedAmount)}</span>
                      <span className="text-gray-400">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button variant="ghost" size="sm" leftIcon={<Eye size={13} />} className="flex-1" onClick={() => navigate(`/campaigns/${c._id}`)}>
                      View
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />} className="flex-1">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create new card */}
          <button
            onClick={() => navigate('/dashboard/campaigns/new')}
            className="card border-2 border-dashed border-brand-200 flex flex-col items-center justify-center p-8 gap-3 hover:border-brand-400 hover:bg-brand-50/50 transition-all min-h-48 text-center"
          >
            <div className="w-12 h-12 rounded-md bg-brand-50 flex items-center justify-center">
              <Plus size={24} className="text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-brand-700">New Campaign</p>
              <p className="text-xs text-gray-400 mt-0.5">Create a verified community campaign</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
