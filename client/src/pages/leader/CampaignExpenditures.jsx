import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Receipt, Package, Truck,
  Users, Wrench, FileText, MoreHorizontal, ChevronDown,
  ChevronUp, ImagePlus, X, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import Progress from '../../components/ui/Progress';
import { campaignApi, expenditureApi, uploadApi } from '../../lib/api';
import { formatCurrency, formatDate, progressPercent } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { value: 'supplies',   label: 'Supplies & Materials',  Icon: Package },
  { value: 'transport',  label: 'Transport & Delivery',  Icon: Truck },
  { value: 'services',   label: 'Professional Services', Icon: Users },
  { value: 'equipment',  label: 'Equipment & Tools',     Icon: Wrench },
  { value: 'admin',      label: 'Administration',        Icon: FileText },
  { value: 'other',      label: 'Other',                 Icon: MoreHorizontal },
];

function categoryIcon(cat) {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? found.Icon : MoreHorizontal;
}

function categoryLabel(cat) {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? found.label : cat;
}

const EMPTY_FORM = {
  amount: '',
  description: '',
  category: 'supplies',
  date: new Date().toISOString().slice(0, 10),
  receiptUrl: '',
  deliveryNote: '',
  beneficiaryCount: '',
};

export default function CampaignExpenditures() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, effectiveRole } = useAuth();
  const isAdmin = (effectiveRole ?? user?.role) === 'admin';

  const [campaign, setCampaign] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([
      campaignApi.getById(id),
      expenditureApi.getByCampaign(id),
    ]).then(([c, exps]) => {
      setCampaign(c);
      setExpenditures(exps);
    }).catch(() => toast.error('Failed to load campaign data.'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalSpent = expenditures.reduce((s, e) => s + (e.amount || 0), 0);
  const raisedAmount = campaign?.raisedAmount || 0;
  const accountabilityPct = raisedAmount > 0 ? Math.min(100, Math.round((totalSpent / raisedAmount) * 100)) : 0;
  const untraced = Math.max(0, raisedAmount - totalSpent);

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleReceiptUpload = async (file) => {
    setUploading(true);
    try {
      const { url } = await uploadApi.image(file, 'receipts');
      handleField('receiptUrl', url);
    } catch {
      toast.error('Receipt upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.date) {
      toast.error('Amount, description, and date are required.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await expenditureApi.create(id, {
        ...form,
        amount: parseFloat(form.amount),
        beneficiaryCount: parseInt(form.beneficiaryCount) || 0,
      });
      setExpenditures(prev => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Expenditure logged.');
    } catch (err) {
      toast.error(err?.message || 'Failed to log expenditure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (exp) => {
    setDeleting(exp.id);
    try {
      await expenditureApi.delete(exp.id);
      setExpenditures(prev => prev.filter(e => e.id !== exp.id));
      toast.success('Expenditure removed.');
    } catch {
      toast.error('Failed to remove expenditure.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={28} className="text-brand-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-gray-400">Campaign not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard/campaigns')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
          >
            <ArrowLeft size={15} /> Back to campaigns
          </button>
          <h1 className="page-header">Expenditure Log</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-lg truncate">{campaign.title}</p>
        </div>
        {!isAdmin && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowForm(v => !v)}
          >
            Log Expenditure
          </Button>
        )}
      </div>

      {/* Accountability summary */}
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-[#001E2B] text-sm">Money Trail Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total Raised</p>
            <p className="text-lg font-black text-[#001E2B]">{formatCurrency(raisedAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total Logged</p>
            <p className="text-lg font-black text-brand-600">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Untraced</p>
            <p className={`text-lg font-black ${untraced > 0 ? 'text-amber-600' : 'text-forest-600'}`}>
              {formatCurrency(untraced)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{accountabilityPct}% of funds accounted for</span>
            {accountabilityPct === 100 && (
              <span className="flex items-center gap-1 text-forest-600 font-semibold">
                <CheckCircle2 size={12} /> Fully traced
              </span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-700"
              style={{ width: `${accountabilityPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Log expenditure form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4 border-brand-200 border-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#001E2B]">New Expenditure</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (RWF)"
              type="number"
              min="1"
              required
              placeholder="e.g. 45000"
              value={form.amount}
              onChange={e => handleField('amount', e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              required
              value={form.date}
              onChange={e => handleField('date', e.target.value)}
            />
          </div>

          <Input
            label="Description"
            required
            placeholder="e.g. 30 school kits purchased from Kimironko market"
            value={form.description}
            onChange={e => handleField('description', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={e => handleField('category', e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            <Input
              label="Beneficiaries Reached"
              type="number"
              min="0"
              placeholder="e.g. 30"
              value={form.beneficiaryCount}
              onChange={e => handleField('beneficiaryCount', e.target.value)}
            />
          </div>

          <Input
            label="Delivery Note"
            placeholder="e.g. Kits distributed to P4 and P5 pupils on 5 June at Bumbogo PS"
            value={form.deliveryNote}
            onChange={e => handleField('deliveryNote', e.target.value)}
          />

          {/* Receipt upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#001E2B]">Receipt / Proof Photo</label>
            {form.receiptUrl ? (
              <div className="relative rounded-md overflow-hidden h-36 bg-gray-50 border border-gray-200">
                <img src={form.receiptUrl} alt="Receipt" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => handleField('receiptUrl', '')}
                  className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white hover:bg-black/70"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-md cursor-pointer hover:border-brand-300 hover:bg-brand-50/40 transition-all">
                {uploading ? (
                  <span className="text-sm text-gray-400">Uploading…</span>
                ) : (
                  <>
                    <ImagePlus size={22} className="text-gray-300 mb-1.5" />
                    <span className="text-sm text-gray-400">Click to upload receipt or delivery photo</span>
                    <span className="text-xs text-gray-300 mt-0.5">JPG, PNG, PDF — max 10MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Save Expenditure
            </Button>
          </div>
        </form>
      )}

      {/* Expenditures list */}
      {expenditures.length === 0 ? (
        <div className="card p-12 text-center">
          <Receipt size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">No expenditures logged yet.</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Log every purchase and delivery here. Each entry becomes part of the public accountability trail that builds donor trust.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {expenditures.map((exp) => {
              const Icon = categoryIcon(exp.category);
              const isExpanded = expanded === exp.id;
              return (
                <div key={exp.id}>
                  <div
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : exp.id)}
                  >
                    <div className="w-9 h-9 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#001E2B] truncate">{exp.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {categoryLabel(exp.category)} · {formatDate(exp.date)}
                        {exp.beneficiaryCount > 0 && ` · ${exp.beneficiaryCount} people reached`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-[#001E2B]">{formatCurrency(exp.amount)}</span>
                      {exp.receiptUrl && (
                        <span className="w-5 h-5 rounded bg-forest-50 flex items-center justify-center" title="Has receipt">
                          <CheckCircle2 size={11} className="text-forest-600" />
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 bg-gray-50/40 border-t border-gray-100">
                      <div className="pt-3 flex flex-col gap-3">
                        {exp.deliveryNote && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery Note</p>
                            <p className="text-sm text-gray-700">{exp.deliveryNote}</p>
                          </div>
                        )}
                        {exp.receiptUrl && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Receipt / Proof</p>
                            <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={exp.receiptUrl}
                                alt="Receipt"
                                className="max-h-48 rounded-md border border-gray-200 object-contain hover:opacity-90 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                        {!isAdmin && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleDelete(exp)}
                              disabled={deleting === exp.id}
                              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 size={12} />
                              {deleting === exp.id ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
