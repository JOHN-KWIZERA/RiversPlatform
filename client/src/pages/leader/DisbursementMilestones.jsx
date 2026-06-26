import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle2, Clock, Upload, Layers,
  ChevronDown, ChevronUp, Trash2, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { campaignApi, disbursementApi, uploadApi } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  pending:         { label: 'Pending',        bg: 'bg-gray-100',      text: 'text-gray-600',    icon: Clock },
  proof_submitted: { label: 'Proof Submitted', bg: 'bg-amber-50',     text: 'text-amber-700',   icon: Upload },
  released:        { label: 'Released',        bg: 'bg-forest-50',    text: 'text-forest-700',  icon: CheckCircle2 },
};

export default function DisbursementMilestones() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const { user, effectiveRole } = useAuth();
  const role = effectiveRole ?? user?.role;
  const isAdmin = role === 'admin';

  const [campaign, setCampaign]     = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [proofForm, setProofForm]   = useState({});   // { [id]: { url, note } }
  const [uploading, setUploading]   = useState(null); // milestone id

  const blankForm = { title: '', description: '', targetAmount: '', dueDate: '' };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    Promise.all([
      campaignApi.getById(campaignId),
      disbursementApi.getByCampaign(campaignId).catch(() => []),
    ]).then(([c, m]) => {
      setCampaign(c);
      setMilestones(m);
    }).catch(() => toast.error('Failed to load milestones.'))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.targetAmount) return toast.error('Title and amount are required.');
    setSaving(true);
    try {
      const m = await disbursementApi.create(campaignId, {
        title:         form.title,
        description:   form.description,
        targetAmount:  parseFloat(form.targetAmount),
        orderIndex:    milestones.length,
        dueDate:       form.dueDate || null,
      });
      setMilestones(prev => [...prev, m]);
      setForm(blankForm);
      toast.success(`Milestone "${m.title}" added.`);
    } catch {
      toast.error('Failed to add milestone.');
    } finally {
      setSaving(false);
    }
  };

  const handleProofUpload = async (milestoneId, file) => {
    setUploading(milestoneId);
    try {
      const url = await uploadApi.document(file, 'disbursement-proofs');
      setProofForm(f => ({ ...f, [milestoneId]: { ...(f[milestoneId] || {}), url } }));
      toast.success('Proof uploaded.');
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitProof = async (m) => {
    const pf = proofForm[m.id] || {};
    if (!pf.url && !pf.note) return toast.error('Add a proof document or note first.');
    try {
      const updated = await disbursementApi.submitProof(m.id, { proofUrl: pf.url || '', proofNote: pf.note || '' });
      setMilestones(prev => prev.map(x => x.id === m.id ? updated : x));
      setProofForm(f => { const next = { ...f }; delete next[m.id]; return next; });
      toast.success('Proof submitted for admin review.');
    } catch {
      toast.error('Failed to submit proof.');
    }
  };

  const handleRelease = async (m) => {
    if (!window.confirm(`Release funds for "${m.title}"? This cannot be undone.`)) return;
    try {
      const updated = await disbursementApi.release(m.id);
      setMilestones(prev => prev.map(x => x.id === m.id ? updated : x));
      toast.success(`Funds released for "${m.title}".`);
    } catch {
      toast.error('Failed to release funds.');
    }
  };

  const handleDelete = async (m) => {
    if (m.status !== 'pending') return toast.error('Only pending milestones can be deleted.');
    if (!window.confirm(`Delete milestone "${m.title}"?`)) return;
    try {
      await disbursementApi.delete(m.id);
      setMilestones(prev => prev.filter(x => x.id !== m.id));
      toast.success('Milestone deleted.');
    } catch {
      toast.error('Failed to delete milestone.');
    }
  };

  const totalPlanned  = milestones.reduce((s, m) => s + (m.targetAmount || 0), 0);
  const totalReleased = milestones.filter(m => m.status === 'released').reduce((s, m) => s + (m.targetAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} className="text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Layers size={20} className="text-brand-500" />
          </div>
          <div>
            <h1 className="page-header">Disbursement Milestones</h1>
            {campaign && <p className="text-sm text-gray-500 mt-0.5 truncate max-w-lg">{campaign.title}</p>}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Milestones',   value: milestones.length,                                    sub: `${formatCurrency(totalPlanned)} planned` },
          { label: 'Released',           value: milestones.filter(m => m.status === 'released').length, sub: formatCurrency(totalReleased) },
          { label: 'Awaiting Review',    value: milestones.filter(m => m.status === 'proof_submitted').length, sub: 'submitted to admin' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-black text-[#001E2B]">{value}</p>
            <p className="text-xs font-semibold text-gray-600">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="card p-5">
        <h2 className="font-semibold text-[#001E2B] mb-4 flex items-center gap-2">
          <Plus size={16} className="text-brand-500" /> Add Milestone
        </h2>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Milestone Title <span className="text-red-500">*</span></label>
            <input type="text" className="input" placeholder="e.g. Purchase school supplies" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Target Amount (RWF) <span className="text-red-500">*</span></label>
            <input type="number" className="input" placeholder="0" min="1" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} required />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea className="input" rows={2} placeholder="What will this milestone accomplish?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="primary" leftIcon={<Plus size={14} />} loading={saving} className="w-full">
              Add Milestone
            </Button>
          </div>
        </form>
      </div>

      {/* Milestones timeline */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-[#001E2B]">Milestones ({milestones.length})</h2>

        {milestones.length === 0 ? (
          <div className="card p-10 text-center">
            <Layers size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No milestones yet. Add your first to enable staged disbursement.</p>
          </div>
        ) : (
          milestones.map((m, i) => {
            const cfg   = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
            const Icon  = cfg.icon;
            const isOpen = expanded === m.id;
            const pf    = proofForm[m.id] || {};
            return (
              <div key={m.id} className="card overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 font-bold text-sm text-gray-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#001E2B]">{m.title}</p>
                    {m.dueDate && <p className="text-xs text-gray-400">Due: {formatDate(m.dueDate)}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-sm border ${cfg.bg} ${cfg.text} border-current/20`}>
                      <Icon size={10} /> {cfg.label}
                    </span>
                    <span className="text-sm font-bold text-[#001E2B]">{formatCurrency(m.targetAmount)}</span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-2 bg-gray-50/60 border-t border-gray-100 flex flex-col gap-3">
                    {m.description && <p className="text-sm text-gray-600">{m.description}</p>}

                    {/* Leader: submit proof */}
                    {m.status === 'pending' && !isAdmin && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-gray-600">Submit proof to release funds:</p>
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file" accept="image/*,.pdf" className="hidden"
                              onChange={e => e.target.files[0] && handleProofUpload(m.id, e.target.files[0])}
                            />
                            <div className="input flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:border-brand-400">
                              <Upload size={14} />
                              {uploading === m.id ? 'Uploading…' : (pf.url ? '✓ Document uploaded' : 'Upload proof document')}
                            </div>
                          </label>
                        </div>
                        <textarea
                          className="input text-sm" rows={2}
                          placeholder="Describe what was accomplished…"
                          value={pf.note || ''}
                          onChange={e => setProofForm(f => ({ ...f, [m.id]: { ...(f[m.id] || {}), note: e.target.value } }))}
                        />
                        <Button size="sm" variant="primary" leftIcon={<Upload size={12} />} onClick={() => handleSubmitProof(m)}>
                          Submit for Review
                        </Button>
                      </div>
                    )}

                    {/* Proof submitted — waiting */}
                    {m.status === 'proof_submitted' && (
                      <div className="flex flex-col gap-2">
                        {m.proofNote && <p className="text-sm text-gray-600 italic">"{m.proofNote}"</p>}
                        {m.proofUrl && (
                          <a href={m.proofUrl} target="_blank" rel="noopener noreferrer"
                             className="text-xs text-brand-600 underline">View submitted document</a>
                        )}
                        {isAdmin ? (
                          <Button size="sm" variant="primary" leftIcon={<CheckCircle2 size={12} />} onClick={() => handleRelease(m)}>
                            Approve &amp; Release Funds
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-700">
                            <Lock size={12} /> Waiting for admin to approve and release funds
                          </div>
                        )}
                      </div>
                    )}

                    {/* Released */}
                    {m.status === 'released' && (
                      <div className="flex items-center gap-2 text-xs text-forest-700">
                        <CheckCircle2 size={12} />
                        Funds released on {m.releasedAt ? formatDate(m.releasedAt) : '—'}
                      </div>
                    )}

                    {m.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(m)}
                        className="self-start flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                      >
                        <Trash2 size={12} /> Delete milestone
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
