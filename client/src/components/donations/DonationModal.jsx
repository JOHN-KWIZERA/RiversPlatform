import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Heart, CreditCard, Smartphone, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Textarea } from '../ui/Input';
import Progress from '../ui/Progress';
import MoMoPaymentFlow from './MoMoPaymentFlow';
import { formatCurrency, progressPercent } from '../../lib/utils';
import { donationApi, auditApi } from '../../lib/api';

const AMOUNTS = [10000, 25000, 50000, 100000, 250000];
const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'MTN Mobile Money', icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  { value: 'card', label: 'Credit / Debit Card', icon: CreditCard },
];

export default function DonationModal({ open, onClose, campaign }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showMoMo, setShowMoMo] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    defaultValues: { amount: '', paymentMethod: 'mobile_money', message: '', isAnonymous: false },
  });

  const pct = campaign ? progressPercent(campaign.raisedAmount, campaign.targetAmount) : 0;

  const handleAmountClick = (amt) => { setSelectedAmount(amt); setValue('amount', amt); };

  const onSubmit = async (data) => {
    const amt = Number(data.amount);
    if (data.paymentMethod === 'mobile_money') {
      setPendingData({ ...data, amount: amt });
      setShowMoMo(true);
      return;
    }
    // Bank / card — direct record
    setLoading(true);
    try {
      await donationApi.create({ campaignId: campaign._id, ...data, amount: amt });
      auditApi.log({ action: 'donation_created', targetType: 'campaign', targetId: campaign._id, targetLabel: campaign.title, metadata: { amount: amt, method: data.paymentMethod } });
      toast.success('Thank you for your donation!');
      reset();
      setSelectedAmount(null);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Donation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoMoSuccess = async (paymentRef) => {
    try {
      await donationApi.create({ campaignId: campaign._id, ...pendingData, paymentRef });
      auditApi.log({ action: 'donation_created', targetType: 'campaign', targetId: campaign._id, targetLabel: campaign.title, metadata: { amount: pendingData.amount, method: 'mobile_money', paymentRef } });
      // Stay on success screen for 2s then close
      setTimeout(() => { setShowMoMo(false); setPendingData(null); reset(); setSelectedAmount(null); onClose(); }, 3000);
    } catch (err) {
      toast.error(err?.message || 'Failed to record donation.');
      setShowMoMo(false);
    }
  };

  if (!campaign) return null;

  return (
    <Modal
      open={open}
      onClose={() => { if (!showMoMo) { reset(); setSelectedAmount(null); onClose(); } }}
      title={showMoMo ? 'MTN Mobile Money' : `Support — ${campaign.title}`}
      size="md"
    >
      {showMoMo ? (
        <MoMoPaymentFlow
          amount={pendingData?.amount}
          campaignTitle={campaign.title}
          onSuccess={handleMoMoSuccess}
          onCancel={() => setShowMoMo(false)}
        />
      ) : (
        <>
          {/* Progress mini */}
          <div className="bg-brand-50 rounded-xl p-4 mb-5">
            <Progress value={pct} />
            <div className="flex justify-between text-xs mt-2">
              <span className="font-semibold text-brand-700">{formatCurrency(campaign.raisedAmount)} raised</span>
              <span className="text-gray-500">Goal: {formatCurrency(campaign.targetAmount)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-[#1a1a2e] mb-2">Choose an amount (RWF)</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {AMOUNTS.map((amt) => (
                  <button key={amt} type="button" onClick={() => handleAmountClick(amt)}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                      selectedAmount === amt ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
                    }`}>
                    {(amt / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
              <Input
                label="Or enter custom amount"
                type="number"
                placeholder="e.g. 75000"
                leftElement={<span className="text-xs font-bold text-gray-500">RWF</span>}
                error={errors.amount?.message}
                {...register('amount', { required: 'Amount is required', min: { value: 1000, message: 'Minimum RWF 1,000' } })}
                onChange={(e) => { setSelectedAmount(null); register('amount').onChange(e); }}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-[#1a1a2e] mb-2">Payment method</p>
              <div className="flex flex-col gap-2">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    watch('paymentMethod') === value ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-200'
                  }`}>
                    <input type="radio" value={value} {...register('paymentMethod')} className="sr-only" />
                    <Icon size={16} className="text-brand-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                    {value === 'mobile_money' && (
                      <span className="ml-auto text-[10px] font-bold bg-[#FFCC00] text-[#001E2B] px-1.5 py-0.5 rounded">MTN</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <Textarea label="Message to community (optional)" placeholder="Share a word of encouragement…" rows={2} {...register('message')} />

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isAnonymous')} className="w-4 h-4 rounded accent-brand-500" />
              <span className="text-sm text-gray-600">Donate anonymously</span>
            </label>

            <Button type="submit" loading={loading} leftIcon={<Heart size={16} />} size="lg" className="w-full mt-2">
              {watch('paymentMethod') === 'mobile_money' ? 'Pay with MTN MoMo' : 'Complete Donation'}
            </Button>
            <p className="text-xs text-center text-gray-400">Secured & verified by RIVERS. Funds go directly to the campaign.</p>
          </form>
        </>
      )}
    </Modal>
  );
}
