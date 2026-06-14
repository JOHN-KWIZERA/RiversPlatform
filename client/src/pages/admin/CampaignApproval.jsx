import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CheckCircle2, XCircle, Eye, MapPin, Globe } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { campaignApi } from '../../lib/api';
import { formatCurrency, statusColor, progressPercent, categoryColor } from '../../lib/utils';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending_review', 'active', 'approved', 'completed', 'rejected'];

export default function CampaignApproval() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 50 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    campaignApi.getAll(params)
      .then(res => setCampaigns(res.campaigns))
      .catch(() => toast.error('Failed to load campaigns.'))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await campaignApi.approve(selected._id, { status: 'active', adminNote: note });
      toast.success(`"${selected.title}" approved.`);
      setCampaigns(prev => prev.map(c => c._id === selected._id ? { ...c, status: 'active' } : c));
      setSelected(null);
      setNote('');
    } catch {
      toast.error('Failed to approve campaign.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!note.trim()) { toast.error('Please add a rejection note.'); return; }
    setActionLoading(true);
    try {
      await campaignApi.approve(selected._id, { status: 'rejected', adminNote: note });
      toast.success('Campaign rejected.');
      setCampaigns(prev => prev.map(c => c._id === selected._id ? { ...c, status: 'rejected' } : c));
      setSelected(null);
      setNote('');
    } catch {
      toast.error('Failed to reject campaign.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.campaigns')}</h1>
        <p className="text-sm text-gray-500 mt-1">Review, approve, and manage all platform campaigns.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input placeholder={t('campaigns.search')} leftElement={<Search size={15} />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-2 rounded-md text-xs font-semibold border transition-all', statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300')}
            >
              {s === 'all' ? 'All' : t(`status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} className="text-brand-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Leader</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-brand-50 overflow-hidden flex-shrink-0">
                          {c.coverImage
                            ? <img src={c.coverImage} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Globe size={16} className="text-brand-300" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#001E2B] truncate max-w-48">{c.title}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={10} />{c.community}
                            <span className={`ml-1 badge border ${categoryColor(c.category)}`}>{t(`categories.${c.category}`)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{c.leaderId?.fullName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={progressPercent(c.raisedAmount, c.targetAmount)} className="w-20" size="sm" />
                        <span className="text-xs text-gray-500">{progressPercent(c.raisedAmount, c.targetAmount)}%</span>
                      </div>
                      <p className="text-xs text-gray-400">{formatCurrency(c.raisedAmount)} / {formatCurrency(c.targetAmount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColor(c.status)}`}>{t(`status.${c.status}`)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelected(c); setNote(''); }} className="p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        {c.status === 'pending_review' && (
                          <>
                            <button onClick={() => { setSelected(c); setNote(''); }} className="p-1.5 rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors" title="Approve">
                              <CheckCircle2 size={14} />
                            </button>
                            <button onClick={() => { setSelected(c); setNote(''); }} className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && (
              <p className="text-center text-gray-400 py-12">{t('campaigns.no_results')}</p>
            )}
          </div>
        )}
      </div>

      {/* Campaign review modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Campaign" size="lg">
        {selected && (
          <div className="flex flex-col gap-4">
            {selected.coverImage && <img src={selected.coverImage} alt="" className="w-full h-48 object-cover rounded-md" />}
            <h3 className="text-lg font-bold text-[#001E2B]">{selected.title}</h3>
            <div className="flex gap-2 flex-wrap">
              <span className={`badge border ${categoryColor(selected.category)}`}>{t(`categories.${selected.category}`)}</span>
              <span className={`badge ${statusColor(selected.status)}`}>{t(`status.${selected.status}`)}</span>
              <span className="badge bg-gray-100 text-gray-600">{selected.community}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-bold text-brand-700">{formatCurrency(selected.targetAmount)}</p>
              </div>
              <div className="bg-forest-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Raised</p>
                <p className="font-bold text-forest-700">{formatCurrency(selected.raisedAmount)}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#001E2B]">Admin note (required for rejection)</label>
              <textarea
                className="input-field mt-1.5 resize-none"
                rows={3}
                placeholder="Add context or feedback for the community leader…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {selected.status === 'pending_review' && (
              <div className="flex gap-3">
                <Button variant="forest" className="flex-1" leftIcon={<CheckCircle2 size={15} />} onClick={handleApprove} loading={actionLoading}>
                  {t('common.approve')}
                </Button>
                <Button variant="danger" className="flex-1" leftIcon={<XCircle size={15} />} onClick={handleReject} loading={actionLoading}>
                  {t('common.reject')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
