import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, MapPin, Calendar, Users, AlertTriangle, Eye, ToggleLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { cn } from '../../lib/utils';

const stripHtml = (html) => html?.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() ?? '';

// ─── Application field config ──────────────────────────────────────────────────

export const DEFAULT_FIELDS = {
  phone:            'required',
  linkedin:         'hidden',
  languages:        'hidden',
  cv:               'hidden',
  idDocument:       'hidden',
  coverLetter:      'required',
  experience:       'optional',
  availableFrom:    'hidden',
  hoursPerWeek:     'hidden',
  emergencyContact: 'hidden',
};

const FIELD_CONFIG = [
  {
    section: 'Personal',
    fields: [
      { key: 'phone',    label: 'Phone Number',          description: 'Volunteer contact number' },
      { key: 'linkedin', label: 'LinkedIn Profile',      description: 'Professional profile link' },
      { key: 'languages',label: 'Languages Spoken',      description: 'Kinyarwanda, English, French, Swahili' },
    ],
  },
  {
    section: 'Documents',
    fields: [
      { key: 'cv',         label: 'CV / Resume',            description: 'PDF or Word document upload' },
      { key: 'idDocument', label: 'National ID / Passport', description: 'Identity document upload' },
    ],
  },
  {
    section: 'Application',
    fields: [
      { key: 'coverLetter',   label: 'Cover Letter',        description: 'Why they want to volunteer' },
      { key: 'experience',    label: 'Skills & Experience', description: 'Relevant background & past work' },
      { key: 'availableFrom', label: 'Available From',      description: 'When can they start?' },
      { key: 'hoursPerWeek',  label: 'Hours Per Week',      description: 'Weekly commitment hours' },
    ],
  },
  {
    section: 'Emergency',
    fields: [
      { key: 'emergencyContact', label: 'Emergency Contact', description: 'Only needed for in-person activities' },
    ],
  },
];

const STEP_LABELS = ['Basic Info', 'Logistics', 'Application Form', 'Review & Submit'];
const VALUE_LABELS = { required: 'Required', optional: 'Optional', hidden: 'Hidden' };

// ─── Preview modal ─────────────────────────────────────────────────────────────

function OpportunityPreviewModal({ open, onClose, data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <Modal open={open} onClose={onClose} title="Opportunity Preview" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${!data.status || data.status === 'open' ? 'bg-forest-50 text-forest-700' : 'bg-gray-100 text-gray-500'}`}>
            {data.status || 'open'}
          </span>
          {data.slots && <span className="text-sm text-gray-400">{data.slots} slots available</span>}
        </div>
        <h2 className="text-xl font-bold text-[#001E2B]">
          {data.title || <span className="text-gray-300 italic">No title yet</span>}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {data.community && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-brand-400" />
              {data.community}{data.district && `, ${data.district}`}
            </span>
          )}
          {data.startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-brand-400" />
              Starts {data.startDate}
            </span>
          )}
          {data.endDate && <span>Ends {data.endDate}</span>}
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-sm text-sm">{s}</span>
            ))}
          </div>
        )}
        <div className="border-t pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</p>
          {data.description && stripHtml(data.description).length > 0 ? (
            <div className="prose-content text-gray-700" dangerouslySetInnerHTML={{ __html: data.description }} />
          ) : (
            <p className="text-sm text-gray-300 italic">No description added yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Field toggle row ──────────────────────────────────────────────────────────

function FieldToggleRow({ fieldKey, label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 text-[11px] font-semibold">
        {['required', 'optional', 'hidden'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(fieldKey, v)}
            className={cn(
              'px-3 py-1.5 capitalize transition-colors border-r border-gray-200 last:border-0',
              value === v
                ? v === 'required'
                  ? 'bg-gray-900 text-white'
                  : v === 'optional'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-white text-gray-400'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {VALUE_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function OpportunityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [showPreview, setShowPreview] = useState(false);
  const [appFields, setAppFields] = useState({ ...DEFAULT_FIELDS });

  const { register, handleSubmit, watch, trigger, reset, control, formState: { errors } } = useForm({
    defaultValues: { slots: 10, status: 'open' },
  });

  const formData = watch();

  useEffect(() => {
    if (!isEdit) return;
    opportunityApi.getById(id)
      .then(opp => {
        reset({
          title: opp.title,
          description: opp.description,
          community: opp.community,
          district: opp.district || '',
          skills: opp.skills?.join(', ') || '',
          startDate: opp.startDate?.slice(0, 10) || '',
          endDate: opp.endDate?.slice(0, 10) || '',
          slots: opp.slots,
          status: opp.status,
        });
        if (opp.applicationFields && Object.keys(opp.applicationFields).length > 0) {
          setAppFields({ ...DEFAULT_FIELDS, ...opp.applicationFields });
        }
      })
      .catch(() => {
        toast.error('Opportunity not found.');
        navigate('/dashboard/opportunities');
      })
      .finally(() => setFetching(false));
  }, [id, isEdit, reset, navigate]);

  const setField = (key, value) => setAppFields(prev => ({ ...prev, [key]: value }));

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        slots: Number(data.slots),
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        applicationFields: appFields,
      };
      if (isEdit) {
        await opportunityApi.update(id, payload);
        toast.success('Opportunity updated!');
      } else {
        await opportunityApi.create(payload);
        toast.success('Opportunity created!');
      }
      navigate('/dashboard/opportunities');
    } catch (err) {
      toast.error(err?.message || 'Failed to save opportunity.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={28} className="text-brand-500" />
      </div>
    );
  }

  const skills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const activeFieldCount = Object.values(appFields).filter(v => v !== 'hidden').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard/opportunities')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Opportunities
          </button>
          <h1 className="page-header">
            {isEdit ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? 'Update the details below. Changes are visible to volunteers immediately.'
              : 'Fill in the details to post a new volunteer opportunity.'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="mt-8 flex-shrink-0"
          onClick={() => setShowPreview(true)}
        >
          <Eye size={14} className="mr-1.5" /> Preview
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            {s < 4 && <div className={`h-px w-8 transition-all ${step > s ? 'bg-brand-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <p className="ml-3 text-sm text-gray-500">{STEP_LABELS[step - 1]}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 flex flex-col gap-5">

        {/* ── Step 1: Basic Info ───────────────────────────── */}
        {step === 1 && (
          <>
            <Input
              label="Title"
              placeholder="e.g. Community Outreach – Bumbogo Primary School"
              required
              error={errors.title?.message}
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 5, message: 'At least 5 characters' },
              })}
            />

            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field: { onChange, value } }) => (
                <RichTextEditor
                  label="Description"
                  required
                  placeholder="What will volunteers do? What impact will this have on the community?"
                  hint="Include tasks, expected outcomes, and any relevant background."
                  error={errors.description?.message}
                  value={value || ''}
                  onChange={onChange}
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Community"
                placeholder="e.g. Bumbogo"
                leftElement={<MapPin size={15} />}
                required
                error={errors.community?.message}
                {...register('community', { required: 'Community is required' })}
              />
              <Input
                label="District"
                placeholder="e.g. Gasabo"
                {...register('district')}
              />
            </div>

            <Button
              type="button"
              onClick={async () => {
                const ok = await trigger(['title', 'description', 'community']);
                if (ok) setStep(2);
              }}
              className="w-full"
            >
              Continue →
            </Button>
          </>
        )}

        {/* ── Step 2: Logistics ────────────────────────────── */}
        {step === 2 && (
          <>
            <Input
              label="Skills Needed"
              placeholder="e.g. Teaching, Kinyarwanda, First Aid"
              hint="Separate multiple skills with commas"
              {...register('skills')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                leftElement={<Calendar size={15} />}
                required
                error={errors.startDate?.message}
                {...register('startDate', { required: 'Start date is required' })}
              />
              <Input
                label="End Date"
                type="date"
                leftElement={<Calendar size={15} />}
                required
                error={errors.endDate?.message}
                {...register('endDate', { required: 'End date is required' })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Available Slots"
                type="number"
                min={1}
                leftElement={<Users size={15} />}
                hint="How many volunteers can you accept?"
                {...register('slots', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'At least 1 slot required' },
                })}
              />
              <Select label="Status" {...register('status')}>
                <option value="open">Open — accepting applications</option>
                <option value="closed">Closed — no longer accepting</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const ok = await trigger(['startDate', 'endDate']);
                  if (ok) setStep(3);
                }}
                className="flex-1"
              >
                Continue →
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: Application Form ─────────────────────── */}
        {step === 3 && (
          <>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <ToggleLeft size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Customize the application form</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Name and email are always collected. Choose which additional fields volunteers must fill in.
                  Keep it short — only ask for what you actually need.
                </p>
              </div>
            </div>

            {FIELD_CONFIG.map(({ section, fields }) => (
              <div key={section} className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{section}</p>
                <div className="border border-gray-200 rounded-xl px-4 divide-y divide-gray-100">
                  {fields.map(f => (
                    <FieldToggleRow
                      key={f.key}
                      fieldKey={f.key}
                      label={f.label}
                      description={f.description}
                      value={appFields[f.key] ?? DEFAULT_FIELDS[f.key]}
                      onChange={setField}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">
                ← Back
              </Button>
              <Button type="button" onClick={() => setStep(4)} className="flex-1">
                Review →
              </Button>
            </div>
          </>
        )}

        {/* ── Step 4: Review & Submit ──────────────────────── */}
        {step === 4 && (
          <>
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3 border border-gray-200">
              <h3 className="font-semibold text-gray-900">Opportunity Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Title</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Community</p>
                  <p className="font-medium">{formData.community}{formData.district && `, ${formData.district}`}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Start Date</p>
                  <p className="font-medium">{formData.startDate || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Slots / Status</p>
                  <p className="font-medium">{formData.slots} · {formData.status}</p>
                </div>
              </div>

              {skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-white text-gray-600 rounded-sm text-xs border">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.description && stripHtml(formData.description).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Description preview</p>
                  <div
                    className="prose-content text-gray-700 text-xs bg-white rounded-md p-2.5 border max-h-28 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                </div>
              )}
            </div>

            {/* Application form summary */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Application form — {activeFieldCount} active field{activeFieldCount !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-[11px] font-medium">Name</span>
                <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-[11px] font-medium">Email</span>
                {FIELD_CONFIG.flatMap(g => g.fields).map(f => {
                  const v = appFields[f.key];
                  if (v === 'hidden') return null;
                  return (
                    <span
                      key={f.key}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium',
                        v === 'required' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'
                      )}
                    >
                      {f.label}{v === 'optional' && ' *'}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Dark = required · Light = optional</p>
            </div>

            {isEdit && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                Changes will be visible to volunteers immediately after saving.
              </p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(3)} className="flex-1">
                ← Back
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                {isEdit ? 'Save Changes' : 'Post Opportunity'}
              </Button>
            </div>
          </>
        )}
      </form>

      <OpportunityPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={formData}
      />
    </div>
  );
}
