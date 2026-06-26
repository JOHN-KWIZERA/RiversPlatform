import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Globe, Pause, Play, X, CheckCircle2,
  Zap, Calendar, CreditCard, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { recurringGivingApi } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

const FREQ_LABELS = { monthly: 'Monthly', quarterly: 'Quarterly' };

const STATUS_CONFIG = {
  active:    { label: 'Active',    bg: 'bg-forest-50',  text: 'text-forest-700', border: 'border-forest-200' },
  paused:    { label: 'Paused',   bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200'  },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200'   },
};

export default function RecurringGiving() {
  const navigate = useNavigate();
  const [pledges, setPledges]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null); // id of the pledge being mutated

  useEffect(() => {
    recurringGivingApi.getMy()
      .then(data => setPledges(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load recurring pledges.'))
      .finally(() => setLoading(false));
  }, []);

  const withAction = (id, fn) => async () => {
    setActing(id);
    try { await fn(); }
    finally { setActing(null); }
  };

  const handlePause = (p) => withAction(p.id, async () => {
    const updated = await recurringGivingApi.pause(p.id);
    setPledges(prev => prev.map(x => x.id === p.id ? updated : x));
    toast.success('Pledge paused.');
  })();

  const handleResume = (p) => withAction(p.id, async () => {
    const updated = await recurringGivingApi.resume(p.id);
    setPledges(prev => prev.map(x => x.id === p.id ? updated : x));
    toast.success('Pledge resumed.');
  })();

  const handleCancel = async (p) => {
    if (!window.confirm(`Cancel your ${FREQ_LABELS[p.frequency]?.toLowerCase()} pledge to "${p.campaignId?.title}"?`)) return;
    withAction(p.id, async () => {
      const updated = await recurringGivingApi.cancel(p.id);
      setPledges(prev => prev.map(x => x.id === p.id ? updated : x));
      toast.success('Pledge cancelled.');
    })();
  };

  const active    = pledges.filter(p => p.status === 'active').length;
  const totalGiven = pledges.reduce((s, p) => s + (p.totalGiven || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Recurring Giving</h1>
        <p className="text-sm text-gray-500 mt-1">Your scheduled monthly pledges to community campaigns.</p>
      </div>

      {/* Payment gateway notice */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 flex items-start gap-3">
        <CreditCard size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-800">MTN Mobile Money integration coming soon</p>
          <p className="text-xs text-brand-600 mt-0.5">
            Your recurring pledges are saved and will be automatically charged once MTN Momo pay-in is enabled. You can manage or cancel pledges at any time.
          </p>
        </div>
      </div>

      {/* Stats */}
      {pledges.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Pledges', value: active,             icon: RefreshCw,    color: 'text-brand-500',  bg: 'bg-brand-50' },
            { label: 'Total Given',    value: formatCurrency(totalGiven), icon: CheckCircle2, color: 'text-forest-600', bg: 'bg-forest-50' },
            { label: 'Charge Count',   value: pledges.reduce((s, p) => s + (p.chargeCount || 0), 0), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xl font-black text-[#001E2B]">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pledge list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : pledges.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
            <RefreshCw size={24} className="text-brand-300" />
          </div>
          <div>
            <p className="font-semibold text-[#001E2B]">No recurring pledges yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Set up a monthly pledge from any active campaign page.
            </p>
          </div>
          <Button variant="secondary" rightIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard/browse')}>
            Browse campaigns
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pledges.map((p) => {
            const cfg     = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
            const campaign = p.campaignId;
            const isBusy  = acting === p.id;
            return (
              <div key={p.id} className="card p-4 flex items-center gap-4">
                {/* Campaign thumb */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-50 flex-shrink-0">
                  {campaign?.coverImage
                    ? <img src={campaign.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Globe size={20} className="text-brand-200" /></div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold text-[#001E2B] truncate hover:text-brand-600 cursor-pointer"
                    onClick={() => campaign?.id && navigate(`/dashboard/campaigns/${campaign.id}`)}
                  >
                    {campaign?.title || 'Campaign'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <RefreshCw size={10} /> {formatCurrency(p.amount)} / {FREQ_LABELS[p.frequency] || p.frequency}
                    </span>
                    {p.nextDueDate && p.status === 'active' && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> Next: {formatDate(p.nextDueDate)}
                      </span>
                    )}
                  </div>
                  {p.totalGiven > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(p.totalGiven)} given · {p.chargeCount} charge{p.chargeCount !== 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.status === 'active' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handlePause(p)}
                      className="p-2 rounded-md text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40"
                      title="Pause pledge"
                    >
                      <Pause size={15} />
                    </button>
                  )}
                  {p.status === 'paused' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleResume(p)}
                      className="p-2 rounded-md text-forest-600 hover:bg-forest-50 transition-colors disabled:opacity-40"
                      title="Resume pledge"
                    >
                      <Play size={15} />
                    </button>
                  )}
                  {p.status !== 'cancelled' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleCancel(p)}
                      className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Cancel pledge"
                    >
                      <X size={15} />
                    </button>
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
