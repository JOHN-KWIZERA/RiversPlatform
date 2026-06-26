import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle2, Shield, Users, Trash2,
  ChevronDown, ChevronUp, ClipboardList, Pencil, X, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { campaignApi, beneficiaryRegisterApi, expenditureApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const KIT_OPTIONS   = ['full', 'core'];
const GRADE_OPTIONS = ['P1','P2','P3','P4','P5','P6','S1','S2','S3','S4','S5','S6','Other'];
const AGE_BANDS     = ['5–7 yrs','8–10 yrs','11–13 yrs','14–16 yrs','17–19 yrs','20+ yrs'];

export default function BeneficiaryRegister() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const { user, effectiveRole } = useAuth();
  const isAdmin = (effectiveRole ?? user?.role) === 'admin';

  const [campaign, setCampaign]       = useState(null);
  const [records, setRecords]         = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [expanded, setExpanded]       = useState(null);

  const blankForm = { ageBand: '', grade: '', kitType: 'full', receivedAt: '', expenditureId: '', notes: '' };
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      campaignApi.getById(campaignId),
      beneficiaryRegisterApi.getByCampaign(campaignId).catch(() => []),
      expenditureApi.getByCampaign(campaignId).catch(() => []),
    ]).then(([c, r, e]) => {
      setCampaign(c);
      setRecords(r);
      setExpenditures(e);
    }).catch(() => toast.error('Failed to load register.'))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const nextRecordId = () => {
    const nums = records.map(r => parseInt(r.recordId?.replace('BNF-', '') || '0', 10)).filter(Boolean);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `BNF-${String(next).padStart(3, '0')}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.receivedAt) return toast.error('Received date is required.');
    setSaving(true);
    try {
      const record = await beneficiaryRegisterApi.create(campaignId, {
        ...form,
        recordId: nextRecordId(),
        expenditureId: form.expenditureId || null,
      });
      setRecords(prev => [...prev, record]);
      setForm(blankForm);
      toast.success(`${record.recordId} added to register.`);
    } catch {
      toast.error('Failed to add record.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (record) => {
    try {
      const updated = await beneficiaryRegisterApi.verify(record.id);
      setRecords(prev => prev.map(r => r.id === record.id ? updated : r));
      toast.success(`${record.recordId} verified.`);
    } catch {
      toast.error('Failed to verify.');
    }
  };

  const handleConfirmDelivery = async (record) => {
    try {
      const note = `Delivery confirmed by leader on ${formatDate(new Date().toISOString())}`;
      const updated = await beneficiaryRegisterApi.confirmDelivery(record.id, note);
      setRecords(prev => prev.map(r => r.id === record.id ? updated : r));
      toast.success(`Delivery confirmed for ${record.recordId}.`);
    } catch {
      toast.error('Failed to confirm delivery.');
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Remove ${record.recordId} from the register?`)) return;
    try {
      await beneficiaryRegisterApi.delete(record.id);
      setRecords(prev => prev.filter(r => r.id !== record.id));
      toast.success(`${record.recordId} removed.`);
    } catch {
      toast.error('Failed to remove record.');
    }
  };

  const handleUpdate = async (record) => {
    if (!editForm.receivedAt) return toast.error('Received date is required.');
    setUpdating(true);
    try {
      const updated = await beneficiaryRegisterApi.update(record.id, {
        ...editForm,
        expenditureId: editForm.expenditureId || null,
      });
      setRecords(prev => prev.map(r => r.id === record.id ? updated : r));
      setEditingId(null);
      toast.success(`${record.recordId} updated.`);
    } catch {
      toast.error('Failed to update record.');
    } finally {
      setUpdating(false);
    }
  };

  const verified  = records.filter(r => r.isVerified).length;
  const confirmed = records.filter(r => r.deliveryConfirmed).length;

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
            <ClipboardList size={20} className="text-brand-500" />
          </div>
          <div>
            <h1 className="page-header">Beneficiary Register</h1>
            {campaign && (
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-lg">{campaign.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Registered', value: records.length,    icon: Users,         color: 'text-brand-500',  bg: 'bg-brand-50' },
          { label: 'Verified',         value: verified,           icon: Shield,        color: 'text-forest-600', bg: 'bg-forest-50' },
          { label: 'Delivery Confirmed', value: confirmed,        icon: CheckCircle2,  color: 'text-amber-600',  bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-black text-[#001E2B]">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <Shield size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Records use anonymised IDs (BNF-001). No real names or photos are stored here — only age band, grade, and kit type. This register is publicly visible on the campaign page.
        </p>
      </div>

      {/* Add form */}
      <div className="card p-5">
        <h2 className="font-semibold text-[#001E2B] mb-4 flex items-center gap-2">
          <Plus size={16} className="text-brand-500" /> Add Beneficiary Record
        </h2>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Age Band</label>
            <select className="input" value={form.ageBand} onChange={e => setForm(f => ({ ...f, ageBand: e.target.value }))}>
              <option value="">Select age band</option>
              {AGE_BANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Grade / Class</label>
            <select className="input" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
              <option value="">Select grade</option>
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Kit Type</label>
            <select className="input" value={form.kitType} onChange={e => setForm(f => ({ ...f, kitType: e.target.value }))}>
              {KIT_OPTIONS.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} Kit</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Received On <span className="text-red-500">*</span></label>
            <input type="date" className="input" value={form.receivedAt} onChange={e => setForm(f => ({ ...f, receivedAt: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Linked Expenditure</label>
            <select className="input" value={form.expenditureId} onChange={e => setForm(f => ({ ...f, expenditureId: e.target.value }))}>
              <option value="">None</option>
              {expenditures.map(exp => (
                <option key={exp.id} value={exp.id}>{exp.description} (RWF {exp.amount?.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Notes (optional)</label>
            <input type="text" className="input" placeholder="Any relevant notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <Button type="submit" variant="primary" leftIcon={<Plus size={14} />} loading={saving}>
              Add Record
            </Button>
          </div>
        </form>
      </div>

      {/* Records list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#001E2B]">Register ({records.length} records)</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No beneficiaries added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((r) => {
              const isOpen = expanded === r.id;
              return (
                <div key={r.id}>
                  <div
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <span className="font-mono font-bold text-sm text-brand-700 w-20 flex-shrink-0">{r.recordId}</span>
                    <div className="flex-1 text-sm text-gray-600">
                      {[r.grade, r.ageBand, r.kitType ? `${r.kitType} kit` : null].filter(Boolean).join(' · ')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {r.isVerified && (
                        <span className="flex items-center gap-0.5 text-xs text-forest-700 bg-forest-50 border border-forest-200 px-1.5 py-0.5 rounded-sm">
                          <Shield size={10} /> Verified
                        </span>
                      )}
                      {r.deliveryConfirmed && (
                        <span className="flex items-center gap-0.5 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-sm">
                          <CheckCircle2 size={10} /> Delivered
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{r.receivedAt ? formatDate(r.receivedAt) : '—'}</span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-2 bg-gray-50/70 flex flex-col gap-3 border-t border-gray-100">
                      {editingId === r.id ? (
                        /* ── Inline edit form ── */
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="form-label">Age Band</label>
                              <select className="input" value={editForm.ageBand} onChange={e => setEditForm(f => ({ ...f, ageBand: e.target.value }))}>
                                <option value="">Select</option>
                                {AGE_BANDS.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Grade</label>
                              <select className="input" value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))}>
                                <option value="">Select</option>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Kit Type</label>
                              <select className="input" value={editForm.kitType} onChange={e => setEditForm(f => ({ ...f, kitType: e.target.value }))}>
                                {KIT_OPTIONS.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} Kit</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Received On</label>
                              <input type="date" className="input" value={editForm.receivedAt} onChange={e => setEditForm(f => ({ ...f, receivedAt: e.target.value }))} />
                            </div>
                            <div>
                              <label className="form-label">Linked Expenditure</label>
                              <select className="input" value={editForm.expenditureId || ''} onChange={e => setEditForm(f => ({ ...f, expenditureId: e.target.value }))}>
                                <option value="">None</option>
                                {expenditures.map(exp => (
                                  <option key={exp.id} value={exp.id}>{exp.description} (RWF {exp.amount?.toLocaleString()})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Notes</label>
                              <input type="text" className="input" value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" leftIcon={<Save size={12} />} loading={updating} onClick={() => handleUpdate(r)}>
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" leftIcon={<X size={12} />} onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── Read view ── */
                        <>
                          {r.notes && <p className="text-xs text-gray-500 italic">"{r.notes}"</p>}
                          <div className="flex flex-wrap gap-2">
                            {isAdmin && !r.isVerified && (
                              <Button size="sm" variant="secondary" leftIcon={<Shield size={12} />} onClick={() => handleVerify(r)}>
                                Mark Verified
                              </Button>
                            )}
                            {isAdmin && !r.deliveryConfirmed && (
                              <Button size="sm" variant="secondary" leftIcon={<CheckCircle2 size={12} />} onClick={() => handleConfirmDelivery(r)}>
                                Confirm Delivery
                              </Button>
                            )}
                            {!r.isVerified && r.recordedBy === user?.id && (
                              <button
                                onClick={() => { setEditingId(r.id); setEditForm({ ageBand: r.ageBand, grade: r.grade, kitType: r.kitType, receivedAt: r.receivedAt || '', expenditureId: r.expenditureId || '', notes: r.notes || '' }); }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                              >
                                <Pencil size={11} /> Edit
                              </button>
                            )}
                            {!r.isVerified && r.recordedBy === user?.id && (
                              <button
                                onClick={() => handleDelete(r)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove record"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
