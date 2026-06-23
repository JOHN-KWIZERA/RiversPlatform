import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, MapPin, Upload, FileText, User, Phone, Mail, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi, uploadApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';

const LANGUAGES = ['Kinyarwanda', 'English', 'French', 'Swahili'];

function DocUpload({ label, required, hint, accept, folder, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let result;
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        result = await uploadApi.image(file, folder);
      } else {
        result = await uploadApi.document(file, folder);
      }
      setUrl(result.url);
      setFileName(file.name);
      onUploaded(result.url);
      toast.success(`${label} uploaded.`);
    } catch {
      toast.error(`Failed to upload ${label}.`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = (e) => {
    e.stopPropagation();
    setUrl('');
    setFileName('');
    onUploaded('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#001E2B]">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all min-h-[90px]"
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Spinner size={16} className="text-brand-500" /> Uploading…
          </div>
        ) : url ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={18} className="text-forest-500" />
            <span className="text-forest-600 font-medium truncate max-w-[180px]" title={fileName}>{fileName}</span>
            <button type="button" onClick={remove} className="text-xs text-red-400 hover:text-red-600 ml-1">Remove</button>
          </div>
        ) : (
          <>
            <Upload size={20} className="text-gray-300" />
            <span className="text-sm text-gray-400">Click to upload</span>
          </>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={handleChange} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-brand-500" />
      </div>
      <div>
        <h2 className="font-bold text-[#001E2B] text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function OpportunityApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cvUrl, setCvUrl] = useState('');
  const [idUrl, setIdUrl] = useState('');
  const [languages, setLanguages] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    opportunityApi.getById(id)
      .then(setOpp)
      .catch(() => {
        toast.error('Opportunity not found.');
        navigate('/dashboard/opportunities');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleLanguage = (lang) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const onSubmit = async (data) => {
    if (!cvUrl) { toast.error('Please upload your CV / Resume.'); return; }
    if (!idUrl) { toast.error('Please upload your ID or Passport.'); return; }
    setSubmitting(true);
    try {
      await opportunityApi.apply(id, {
        ...data,
        languages,
        cvUrl,
        idDocumentUrl: idUrl,
        hoursPerWeek: data.hoursPerWeek ? Number(data.hoursPerWeek) : undefined,
      });
      toast.success('Application submitted! Good luck!');
      navigate(`/dashboard/opportunities/${id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-500" /></div>;
  }
  if (!opp) return null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/dashboard/opportunities/${id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Opportunity
        </button>
        <h1 className="page-header">Apply — {opp.title}</h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
          <MapPin size={13} className="text-brand-400" />
          {opp.community}{opp.district && `, ${opp.district}`}
          {opp.startDate && <> · Starts {formatDate(opp.startDate)}</>}
        </p>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
        <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
        Fields marked * are required. Your documents are stored securely and only shared with the opportunity organizer.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Section 1: Personal Information */}
        <div className="card p-5 flex flex-col gap-4">
          <SectionHeader icon={User} title="Personal Information" />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              error={errors.fullName?.message}
              {...register('fullName', { required: 'Full name is required' })}
            />
            <Input
              label="Email Address"
              type="email"
              required
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+250 7XX XXX XXX"
              required
              error={errors.phone?.message}
              {...register('phone', { required: 'Phone number is required' })}
            />
            <Input
              label="LinkedIn Profile"
              placeholder="linkedin.com/in/your-profile"
              hint="Optional — helps the organizer learn more about you"
              {...register('linkedIn')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#001E2B] block mb-2">
              Languages Spoken <span className="text-xs text-gray-400 font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                    languages.includes(lang)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Documents */}
        <div className="card p-5 flex flex-col gap-4">
          <SectionHeader
            icon={FileText}
            title="Required Documents"
            subtitle="Both documents are mandatory for all applications"
          />
          <div className="grid grid-cols-2 gap-4">
            <DocUpload
              label="CV / Resume"
              required
              hint="PDF, DOC, DOCX — max 5 MB"
              accept=".pdf,.doc,.docx"
              folder="applications/cv"
              onUploaded={setCvUrl}
            />
            <DocUpload
              label="National ID / Passport"
              required
              hint="PDF, JPG, PNG — max 5 MB"
              accept=".pdf,.jpg,.jpeg,.png"
              folder="applications/id"
              onUploaded={setIdUrl}
            />
          </div>
        </div>

        {/* Section 3: Your Application */}
        <div className="card p-5 flex flex-col gap-4">
          <SectionHeader
            icon={Mail}
            title="Your Application"
            subtitle="Tell the organizer why you're the right fit"
          />
          <Textarea
            label="Cover Letter"
            required
            placeholder="Introduce yourself and explain why you'd like to volunteer for this opportunity. What motivates you?"
            rows={5}
            error={errors.coverLetter?.message}
            {...register('coverLetter', {
              required: 'A cover letter is required',
              minLength: { value: 100, message: 'Please write at least 100 characters' },
            })}
          />
          <Textarea
            label="Relevant Skills & Experience"
            required
            placeholder="Describe your background, previous volunteer work, or professional experience relevant to this opportunity…"
            rows={4}
            error={errors.experience?.message}
            {...register('experience', { required: 'Please describe your relevant experience' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Available From"
              type="date"
              hint="When can you start?"
              {...register('availableFrom')}
            />
            <Input
              label="Hours Per Week"
              type="number"
              min={1}
              max={40}
              placeholder="e.g. 10"
              hint="How many hours can you commit weekly?"
              {...register('hoursPerWeek')}
            />
          </div>
        </div>

        {/* Section 4: Emergency Contact */}
        <div className="card p-5 flex flex-col gap-4">
          <SectionHeader
            icon={Phone}
            title="Emergency Contact"
            subtitle="Optional — used only in case of an emergency during in-person activities"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Full Name"
              placeholder="e.g. Marie Uwimana"
              {...register('emergencyContactName')}
            />
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+250 7XX XXX XXX"
              {...register('emergencyContactPhone')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/dashboard/opportunities/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
