import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Phone, Lock, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';

const STEPS = { PHONE: 'phone', PIN: 'pin', PROCESSING: 'processing', SUCCESS: 'success', FAILED: 'failed' };

export default function MoMoPaymentFlow({ amount, campaignTitle, onSuccess, onCancel }) {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Auto-advance from processing after 2.5s (simulating async MoMo callback)
  useEffect(() => {
    if (step !== STEPS.PROCESSING) return;
    const timer = setTimeout(() => {
      const ref = `MTN-${Date.now().toString(36).toUpperCase()}-RW`;
      setReceipt({
        ref,
        phone,
        amount,
        campaignTitle,
        timestamp: new Date().toLocaleString('en-RW', { dateStyle: 'medium', timeStyle: 'short' }),
      });
      setStep(STEPS.SUCCESS);
      onSuccess(ref);
    }, 2500);
    return () => clearTimeout(timer);
  }, [step]);

  const validatePhone = (v) => /^07[2389]\d{7}$/.test(v.replace(/\s/g, ''));

  const handlePhoneSubmit = () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!validatePhone(cleaned)) {
      setPhoneError('Enter a valid MTN Rwanda number (e.g. 078 123 4567)');
      return;
    }
    setPhoneError('');
    setStep(STEPS.PIN);
  };

  const handlePinSubmit = () => {
    if (pin.length !== 5) return;
    setStep(STEPS.PROCESSING);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* MTN MoMo branded header */}
      <div className="flex items-center gap-3 bg-[#FFCC00] rounded-xl px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <span className="text-[#FFCC00] font-black text-xs leading-none text-center">MTN<br/>MoMo</span>
        </div>
        <div>
          <p className="font-black text-[#001E2B] text-sm">MTN Mobile Money</p>
          <p className="text-[#001E2B]/70 text-xs">Rwanda · Secure payment</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-[#001E2B]/60">Amount</p>
          <p className="font-black text-[#001E2B]">{formatCurrency(amount)}</p>
        </div>
      </div>

      {/* Step: Phone number */}
      {step === STEPS.PHONE && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-[#001E2B] mb-1">MTN Mobile Money Number</p>
            <p className="text-xs text-gray-500 mb-3">Enter the phone number to debit for this payment.</p>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="078 123 4567"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                maxLength={13}
                autoFocus
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{phoneError}</p>
            )}
          </div>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
            You will receive a payment prompt on <strong>{phone || 'your phone'}</strong>. Approve it by entering your MoMo PIN.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button className="flex-1 bg-[#FFCC00] text-[#001E2B] hover:bg-[#f0c000] border-0" onClick={handlePhoneSubmit}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step: PIN */}
      {step === STEPS.PIN && (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFCC00]/20 flex items-center justify-center mx-auto mb-3">
              <Lock size={24} className="text-[#FFCC00]" />
            </div>
            <p className="text-sm font-semibold text-[#001E2B]">Enter your MoMo PIN</p>
            <p className="text-xs text-gray-500 mt-1">Confirm payment of <strong>{formatCurrency(amount)}</strong> to {campaignTitle}</p>
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                pin.length > i ? 'border-[#FFCC00] bg-[#FFCC00]/10 text-[#001E2B]' : 'border-gray-200 text-transparent'
              }`}>
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>
          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
              <button
                key={i}
                disabled={k === ''}
                onClick={() => {
                  if (k === '⌫') setPin(p => p.slice(0,-1));
                  else if (pin.length < 5) setPin(p => p + k);
                }}
                className={`h-12 rounded-xl text-sm font-bold transition-all ${
                  k === '' ? 'invisible' :
                  k === '⌫' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                  'bg-gray-50 text-[#001E2B] hover:bg-[#FFCC00]/20 border border-gray-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(STEPS.PHONE)}>Back</Button>
            <Button
              className="flex-1 bg-[#FFCC00] text-[#001E2B] hover:bg-[#f0c000] border-0"
              disabled={pin.length !== 5}
              onClick={handlePinSubmit}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === STEPS.PROCESSING && (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 size={40} className="text-[#FFCC00] animate-spin" />
          <div className="text-center">
            <p className="font-semibold text-[#001E2B]">Processing payment…</p>
            <p className="text-xs text-gray-500 mt-1">Please wait. Do not close this window.</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-[#FFCC00] rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Step: Success + Receipt */}
      {step === STEPS.SUCCESS && receipt && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-forest-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-forest-600" />
            </div>
            <p className="font-black text-[#001E2B] text-lg">Payment Successful!</p>
            <p className="text-xs text-gray-500">Thank you for your generosity.</p>
          </div>
          {/* Receipt card */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-2 text-sm">
            <div className="flex justify-between border-b border-dashed border-gray-300 pb-2 mb-1">
              <span className="font-bold text-[#001E2B]">RIVERS Receipt</span>
              <span className="text-xs text-gray-400">{receipt.timestamp}</span>
            </div>
            {[
              ['Transaction Ref', receipt.ref],
              ['Amount Paid', formatCurrency(receipt.amount)],
              ['From', receipt.phone],
              ['Campaign', receipt.campaignTitle],
              ['Status', 'Completed ✓'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-[#001E2B] text-right max-w-[55%] truncate">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">A confirmation SMS has been sent to {receipt.phone}</p>
        </div>
      )}
    </div>
  );
}
