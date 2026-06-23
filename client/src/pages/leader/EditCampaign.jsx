import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Target, MapPin, Calendar, AlertTriangle, ImagePlus, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Spinner from '../../components/ui/Spinner';
import { campaignApi, uploadApi } from '../../lib/api';

const stripHtml = (html) => html?.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() ?? '';

const CATEGORIES = ['education', 'healthcare', 'food_security', 'emergency', 'housing', 'youth_employment'];

function CampaignPreviewModal({ open, onClose, data, t }) {
  return (
    <Modal open={open} onClose={onClose} title="Campaign Preview" size="md">
      <div className="flex flex-col gap-4">
        {data.coverImage && (
          <img src={data.coverImage} alt="Cover" className="w-full h-44 object-cover rounded-xl" />
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {data.category && (
            <span className="badge bg-brand-50 text-brand-700">{t(`categories.${data.category}`)}</span>
          )}
          {data.isUrgent && <span className="badge bg-red-50 text-red-600">Urgent</span>}
        </div>
        <h2 className="text-xl font-bold text-[#001E2B]">{data.title || <span className="text-gray-300 italic">No title yet</span>}</h2>
        {data.community && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <MapPin size={13} className="text-brand-400" /> {data.community}
          </p>
        )}
        {data.targetAmount && (
          <p className="text-sm font-semibold text-brand-600">
            Goal: RWF {Number(data.targetAmount).toLocaleString()}
            {data.startDate && <> · Starts {data.startDate}</>}
          </p>
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

export default function EditCampaign() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, watch, trigger, reset, setValue, control, formState: { errors } } = useForm();

  const formData = watch();

  useEffect(() => {
    campaignApi.getById(id)
      .then((c) => {
        reset({
          title: c.title,
          description: c.description,
          category: c.category,
          community: c.community,
          targetAmount: c.targetAmount,
          beneficiaryCount: c.beneficiaryCount || '',
          startDate: c.startDate ? c.startDate.slice(0, 10) : '',
          endDate: c.endDate ? c.endDate.slice(0, 10) : '',
          coverImage: c.coverImage || '',
          isUrgent: c.isUrgent || false,
        });
        setPreviewUrl(c.coverImage || '');
      })
      .catch(() => toast.error('Failed to load campaign.'))
      .finally(() => setFetching(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await campaignApi.update(id, {
        ...data,
        targetAmount: Number(data.targetAmount),
        beneficiaryCount: data.beneficiaryCount ? Number(data.beneficiaryCount) : undefined,
      });
      toast.success('Campaign updated and sent for review.');
      navigate('/dashboard/campaigns');
    } catch (err) {
      toast.error(err?.message || 'Failed to update campaign.');
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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
          >
            <ArrowLeft size={15} /> {t('common.back')}
          </button>
          <h1 className="page-header">Edit Campaign</h1>
          <p className="text-sm text-gray-500 mt-1">Changes go back to Pending Review until an admin approves them.</p>
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
          {step === 1 ? 'Basic Details' : step === 2 ? 'Campaign Goals' : 'Review & Save'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 flex flex-col gap-5">
        {step === 1 && (
          <>
            <Input
              label="Campaign Title"
              required
              error={errors.title?.message}
              {...register('title', { required: 'Title is required', minLength: { value: 10, message: 'Min 10 characters' } })}
            />

            <Controller
              name="description"
              control={control}
              rules={{
                required: 'Description is required',
                validate: (v) => stripHtml(v).length >= 50 || 'Minimum 50 characters',
              }}
              render={({ field: { onChange, value } }) => (
                <RichTextEditor
                  label="Description"
                  required
                  error={errors.description?.message}
                  value={value || ''}
                  onChange={onChange}
                />
              )}
            />

            <Select label="Category" required {...register('category', { required: true })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`categories.${c}`)}</option>
              ))}
            </Select>

            <Input
              label="Community / Sector"
              leftElement={<MapPin size={15} />}
              required
              error={errors.community?.message}
              {...register('community', { required: 'Community is required' })}
            />

            <Button type="button" onClick={async () => {
              const ok = await trigger(['title', 'description', 'category', 'community']);
              if (ok) setStep(2);
            }} className="w-full">
              Continue →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Amount (RWF)"
                type="number"
                leftElement={<Target size={15} />}
                required
                error={errors.targetAmount?.message}
                {...register('targetAmount', { required: 'Required', min: { value: 50000, message: 'Min RWF 50,000' } })}
              />
              <Input
                label="Expected Beneficiaries"
                type="number"
                {...register('beneficiaryCount')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                leftElement={<Calendar size={15} />}
                {...register('startDate')}
              />
              <Input
                label="End Date"
                type="date"
                leftElement={<Calendar size={15} />}
                {...register('endDate')}
              />
            </div>

            {/* Cover image */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#001E2B]">Cover Image</label>
              {previewUrl ? (
                <div className="relative rounded-md overflow-hidden h-40 bg-brand-50">
                  <img src={previewUrl} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPreviewUrl(''); setValue('coverImage', ''); }}
                    className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-md cursor-pointer hover:border-brand-300 hover:bg-brand-50/50 transition-all">
                  {uploading ? (
                    <span className="text-sm text-gray-400">Uploading…</span>
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-gray-300 mb-2" />
                      <span className="text-sm text-gray-400">Click to replace cover image</span>
                      <span className="text-xs text-gray-300 mt-0.5">JPG, PNG, WebP — max 10MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const { url } = await uploadApi.image(file, 'campaigns');
                        setPreviewUrl(url);
                        setValue('coverImage', url);
                      } catch {
                        toast.error('Image upload failed.');
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
              )}
              <input type="hidden" {...register('coverImage')} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="urgent" {...register('isUrgent')} className="w-4 h-4 rounded accent-brand-500" />
              <label htmlFor="urgent" className="text-sm text-gray-600 cursor-pointer">
                Mark as <strong>Urgent</strong>
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
              <Button type="button" onClick={async () => {
                const ok = await trigger(['targetAmount']);
                if (ok) setStep(3);
              }} className="flex-1">Review →</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-brand-50 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-[#1a1a2e]">Campaign Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-gray-500">Title</p><p className="font-medium">{formData.title}</p></div>
                <div><p className="text-xs text-gray-500">Category</p><p className="font-medium">{t(`categories.${formData.category}`)}</p></div>
                <div><p className="text-xs text-gray-500">Community</p><p className="font-medium">{formData.community}</p></div>
                <div><p className="text-xs text-gray-500">Target</p><p className="font-medium">RWF {Number(formData.targetAmount || 0).toLocaleString()}</p></div>
              </div>
            </div>

            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              Saving will move this campaign back to <strong className="mx-1">Pending Review</strong> until an admin approves the changes.
            </p>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
              <Button type="submit" loading={loading} className="flex-1">Save & Submit for Review</Button>
            </div>
          </>
        )}
      </form>

      <CampaignPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={formData}
        t={t}
      />
    </div>
  );
}
