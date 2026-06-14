import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Target, MapPin, Calendar, AlertTriangle, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import { campaignApi, uploadApi } from '../../lib/api';

const CATEGORIES = ['education', 'healthcare', 'food_security', 'emergency', 'housing', 'youth_employment'];

export default function CreateCampaign() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { currency: 'RWF', category: 'education' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await campaignApi.create({ ...data, status: 'pending_review' });
      toast.success('Campaign submitted for review.');
      navigate('/dashboard/campaigns');
    } catch (err) {
      toast.error(err?.message || 'Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors">
          <ArrowLeft size={15} /> {t('common.back')}
        </button>
        <h1 className="page-header">Create Campaign</h1>
        <p className="text-sm text-gray-500 mt-1">Complete all details. Your campaign will be reviewed before going live.</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            {s < 3 && <div className={`h-px w-8 transition-all ${step > s ? 'bg-brand-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <p className="ml-3 text-sm text-gray-500">
          {step === 1 ? 'Basic Details' : step === 2 ? 'Campaign Goals' : 'Review & Submit'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 flex flex-col gap-5">
        {step === 1 && (
          <>
            <Input
              label="Campaign Title"
              placeholder="e.g. School Supplies for Bumbogo Children"
              required
              error={errors.title?.message}
              {...register('title', { required: 'Title is required', minLength: { value: 10, message: 'Title must be at least 10 characters' } })}
            />
            <Textarea
              label="Description"
              placeholder="Describe the need, the community, and what the funds will specifically be used for…"
              rows={5}
              required
              hint="Be specific — campaigns with detailed descriptions raise 40% more."
              error={errors.description?.message}
              {...register('description', { required: 'Description is required', minLength: { value: 50, message: 'Minimum 50 characters' } })}
            />
            <Select
              label="Category"
              required
              {...register('category', { required: true })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`categories.${c}`)}</option>
              ))}
            </Select>
            <Input
              label="Community / Sector"
              leftElement={<MapPin size={15} />}
              placeholder="e.g. Bumbogo, Gasabo District"
              required
              error={errors.community?.message}
              {...register('community', { required: 'Community is required' })}
            />
            <Button type="button" onClick={() => setStep(2)} className="w-full">
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
                placeholder="e.g. 2000000"
                required
                error={errors.targetAmount?.message}
                {...register('targetAmount', { required: 'Target amount is required', min: { value: 50000, message: 'Minimum RWF 50,000' } })}
              />
              <Input
                label="Expected Beneficiaries"
                type="number"
                placeholder="e.g. 50"
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
            {/* Cover image upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#001E2B]">Cover Image</label>
              {previewUrl ? (
                <div className="relative rounded-md overflow-hidden h-40 bg-brand-50">
                  <img src={previewUrl} alt="Cover preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPreviewUrl(''); register('coverImage').onChange({ target: { value: '' } }); }}
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
                      <span className="text-sm text-gray-400">Click to upload cover image</span>
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
                        register('coverImage').onChange({ target: { value: url } });
                      } catch {
                        toast.error('Upload failed. Check your Supabase config.');
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
                Mark as <strong>Urgent</strong> — use only for emergency or time-critical situations
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
              <Button type="button" onClick={() => setStep(3)} className="flex-1">Review →</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-brand-50 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-[#1a1a2e]">Campaign Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-gray-500">Title</p><p className="font-medium">{watch('title')}</p></div>
                <div><p className="text-xs text-gray-500">Category</p><p className="font-medium">{t(`categories.${watch('category')}`)}</p></div>
                <div><p className="text-xs text-gray-500">Community</p><p className="font-medium">{watch('community')}</p></div>
                <div><p className="text-xs text-gray-500">Target</p><p className="font-medium">RWF {Number(watch('targetAmount') || 0).toLocaleString()}</p></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              By submitting, you confirm that all information is accurate and verified. Your campaign will be reviewed by a RIVERS administrator within 24–48 hours.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
              <Button type="submit" loading={loading} className="flex-1">Submit Campaign</Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
