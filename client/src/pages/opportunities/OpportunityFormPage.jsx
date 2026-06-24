import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, MapPin, Calendar, Users, AlertTriangle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';

const stripHtml = (html) => html?.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() ?? '';

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
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">Description</p>
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

export default function OpportunityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [showPreview, setShowPreview] = useState(false);

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
      })
      .catch(() => {
        toast.error('Opportunity not found.');
        navigate('/dashboard/opportunities');
      })
      .finally(() => setFetching(false));
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        slots: Number(data.slots),
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
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
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            {s < 3 && <div className={`h-px w-8 transition-all ${step > s ? 'bg-brand-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <p className="ml-3 text-sm text-gray-500">
          {step === 1 ? 'Basic Info' : step === 2 ? 'Logistics' : 'Review & Submit'}
        </p>
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
                Review →
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: Review & Submit ──────────────────────── */}
        {step === 3 && (
          <>
            <div className="bg-brand-50 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-[#1a1a2e]">Opportunity Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Community</p>
                  <p className="font-medium">{formData.community}{formData.district && `, ${formData.district}`}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium">{formData.startDate || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Slots / Status</p>
                  <p className="font-medium">{formData.slots} · {formData.status}</p>
                </div>
              </div>

              {skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-white text-gray-600 rounded-sm text-xs border">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.description && stripHtml(formData.description).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Description preview</p>
                  <div
                    className="prose-content text-gray-700 text-xs bg-white rounded-md p-2.5 border max-h-28 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                </div>
              )}
            </div>

            {isEdit && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                Changes will be visible to volunteers immediately after saving.
              </p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">
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
