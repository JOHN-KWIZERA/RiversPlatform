import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, CheckCircle2, XCircle, Eye, MapPin, Globe,
  ArrowLeft, Clock, Users, Heart, Zap, Calendar, X,
} from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { campaignApi } from '../../lib/api';
import {
  formatCurrency, formatDate, statusColor, progressPercent, categoryColor, cn,
} from '../../lib/utils';
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

  const openDetail = (campaign) => {
    setSelected(campaign);
    setNote('');
  };

  const closeDetail = () => setSelected(null);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await campaignApi.approve(selected._id, { status: 'active', adminNote: note });
      toast.success(`"${selected.title}" approved.`);
      setCampaigns(prev => prev.map(c => c._id === selected._id ? { ...c, status: 'active' } : c));
      setSelected(prev => ({ ...prev, status: 'active' }));
      setNote('');
    } catch {
      toast.error('Failed to approve campaign.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!note.trim()) { toast.error('A rejection note is required.'); return; }
    setActionLoading(true);
    try {
      await campaignApi.approve(selected._id, { status: 'rejected', adminNote: note });
      toast.success('Campaign rejected.');
      setCampaigns(prev => prev.map(c => c._id === selected._id ? { ...c, status: 'rejected' } : c));
      setSelected(prev => ({ ...prev, status: 'rejected' }));
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
          <Input
            placeholder={t('campaigns.search')}
            leftElement={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-md text-xs font-semibold border transition-all',
                statusFilter === s
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300',
              )}
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
                        <button
                          onClick={() => openDetail(c)}
                          className="p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                          title="View full details"
                        >
                          <Eye size={14} />
                        </button>
                        {c.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => openDetail(c)}
                              className="p-1.5 rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => openDetail(c)}
                              className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
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

      {/* Full-screen campaign detail overlay */}
      {selected && <CampaignDetailOverlay
        campaign={selected}
        note={note}
        onNoteChange={setNote}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={closeDetail}
        actionLoading={actionLoading}
        t={t}
      />}
    </div>
  );
}

function CampaignDetailOverlay({ campaign: c, note, onNoteChange, onApprove, onReject, onClose, actionLoading, t }) {
  const pct = progressPercent(c.raisedAmount, c.targetAmount);
  const daysLeft = c.endDate
    ? Math.max(0, Math.ceil((new Date(c.endDate) - Date.now()) / 86400000))
    : null;

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={15} /> Back to campaigns
        </button>
        <div className="flex items-center gap-2">
          <span className={`badge ${statusColor(c.status)}`}>{t(`status.${c.status}`)}</span>
          {c.isUrgent && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-sm">
              <Zap size={11} /> Urgent
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left — campaign content */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Cover image */}
              <div className="relative rounded-lg overflow-hidden h-72 bg-brand-50">
                {c.coverImage ? (
                  <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe size={56} className="text-brand-200" />
                  </div>
                )}
                {c.isUrgent && (
                  <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-sm shadow">
                      <Zap size={11} /> Urgent
                    </span>
                  </div>
                )}
              </div>

              {/* Title + meta */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`badge border ${categoryColor(c.category)}`}>
                    {t(`categories.${c.category}`)}
                  </span>
                  <span className={`badge ${statusColor(c.status)}`}>
                    {t(`status.${c.status}`)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#001E2B] leading-tight">{c.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{c.community}{c.district ? `, ${c.district}` : ''}</span>
                  {c.startDate && (
                    <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(c.startDate)}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-base font-bold text-[#001E2B] mb-2">About this campaign</h3>
                <div
                  className="prose-content text-gray-600 text-sm"
                  dangerouslySetInnerHTML={{ __html: c.description }}
                />
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Donors', value: c.donorCount, icon: Heart },
                  { label: 'Beneficiaries', value: c.beneficiaryCount, icon: Users },
                  ...(daysLeft !== null && c.status !== 'completed'
                    ? [{ label: 'Days left', value: daysLeft, icon: Clock }]
                    : []),
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="card p-4 text-center">
                    <Icon size={18} className="text-brand-500 mx-auto mb-1" />
                    <p className="text-xl font-black text-[#001E2B]">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Existing admin note */}
              {c.adminNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-xs font-bold text-amber-700 mb-1">Previous Admin Note</p>
                  <p className="text-sm text-amber-800">{c.adminNote}</p>
                </div>
              )}
            </div>

            {/* Right — admin action sidebar */}
            <div className="flex flex-col gap-4">
              <div className="card p-5 sticky top-4">

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xl font-black text-[#001E2B]">{formatCurrency(c.raisedAmount)}</span>
                    <span className="text-sm text-gray-400">{pct}%</span>
                  </div>
                  <Progress value={pct} size="lg" />
                  <p className="text-xs text-gray-400 mt-1.5">of {formatCurrency(c.targetAmount)} goal</p>
                </div>

                {/* Days remaining */}
                {c.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                    <Clock size={14} className="text-brand-400" />
                    {c.status === 'completed' ? 'Campaign completed' : `${daysLeft} days remaining`}
                  </div>
                )}

                {/* Approve / Reject */}
                {c.status === 'pending_review' && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Admin note <span className="text-gray-400 font-normal">(required for rejection)</span>
                      </label>
                      <textarea
                        className="input-field resize-none text-sm"
                        rows={3}
                        placeholder="Add feedback or context for the community leader…"
                        value={note}
                        onChange={(e) => onNoteChange(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="forest"
                      className="w-full"
                      leftIcon={<CheckCircle2 size={15} />}
                      onClick={onApprove}
                      loading={actionLoading}
                    >
                      {t('common.approve')}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      leftIcon={<XCircle size={15} />}
                      onClick={onReject}
                      loading={actionLoading}
                    >
                      {t('common.reject')}
                    </Button>
                  </div>
                )}

                {c.status !== 'pending_review' && (
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold ${
                    c.status === 'active' || c.status === 'approved' ? 'bg-brand-50 text-brand-700' :
                    c.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {c.status === 'active' || c.status === 'approved'
                      ? <><CheckCircle2 size={16} /> Approved & live</>
                      : c.status === 'rejected'
                      ? <><XCircle size={16} /> Rejected</>
                      : t(`status.${c.status}`)
                    }
                  </div>
                )}

                {/* Leader info */}
                {c.leaderId && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Campaign Leader</p>
                    <div className="flex items-center gap-2">
                      <Avatar name={c.leaderId.fullName} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-[#001E2B]">{c.leaderId.fullName}</p>
                        {c.leaderId.community && (
                          <p className="text-xs text-gray-400">{c.leaderId.community}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
