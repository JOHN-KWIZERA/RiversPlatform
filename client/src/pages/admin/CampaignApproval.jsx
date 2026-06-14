import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, CheckCircle2, XCircle, Eye, MapPin } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Modal from '../../components/ui/Modal';
import { MOCK_CAMPAIGNS, formatCurrency, statusColor, progressPercent, categoryColor } from '../../lib/utils';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending_review', 'active', 'approved', 'completed', 'rejected'];

export default function CampaignApproval() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');

  const filtered = MOCK_CAMPAIGNS.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.community.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleApprove = () => {
    toast.success(`Campaign "${selected.title}" approved`);
    setSelected(null);
  };

  const handleReject = () => {
    if (!note.trim()) { toast.error('Please add a rejection note'); return; }
    toast.success('Campaign rejected with note');
    setSelected(null);
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
              className={cn('px-3 py-2 rounded-xl text-xs font-semibold border transition-all', statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200')}
            >
              {s === 'all' ? 'All' : t(`status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50/60 border-b border-brand-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Leader</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 overflow-hidden flex-shrink-0">
                        {c.coverImage ? <img src={c.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🌍</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1a1a2e] truncate max-w-48">{c.title}</p>
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
                      <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      {c.status === 'pending_review' && (
                        <>
                          <button onClick={() => { setSelected(c); handleApprove(); }} className="p-1.5 rounded-lg bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors" title="Approve">
                            <CheckCircle2 size={14} />
                          </button>
                          <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
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
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-12">{t('campaigns.no_results')}</p>
          )}
        </div>
      </div>

      {/* Campaign review modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Campaign" size="lg">
        {selected && (
          <div className="flex flex-col gap-4">
            {selected.coverImage && <img src={selected.coverImage} alt="" className="w-full h-48 object-cover rounded-xl" />}
            <h3 className="text-lg font-bold text-[#1a1a2e]">{selected.title}</h3>
            <div className="flex gap-2 flex-wrap">
              <span className={`badge border ${categoryColor(selected.category)}`}>{t(`categories.${selected.category}`)}</span>
              <span className={`badge ${statusColor(selected.status)}`}>{t(`status.${selected.status}`)}</span>
              <span className="badge bg-gray-100 text-gray-600">{selected.community}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-bold text-brand-700">{formatCurrency(selected.targetAmount)}</p>
              </div>
              <div className="bg-forest-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Raised</p>
                <p className="font-bold text-forest-700">{formatCurrency(selected.raisedAmount)}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1a1a2e]">Admin note (required for rejection)</label>
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
                <Button variant="forest" className="flex-1" leftIcon={<CheckCircle2 size={15} />} onClick={handleApprove}>
                  {t('common.approve')}
                </Button>
                <Button variant="danger" className="flex-1" leftIcon={<XCircle size={15} />} onClick={handleReject}>
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
