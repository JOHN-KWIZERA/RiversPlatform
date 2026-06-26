import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, MapPin, Upload, FileText, User, Phone, Mail, Clock, CheckCircle2, Calendar, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi, uploadApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import { DEFAULT_FIELDS } from './OpportunityFormPage';

const LANGUAGES = ['Kinyarwanda', 'English', 'French', 'Swahili'];

// ─── Sub-components ────────────────────────────────────────────────────────────

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
        className="border-2 border-dashed border-gray-200 rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all min-h-[90px]"
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Spinner size={16} className="text-gray-500" /> Uploading…
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
      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div>
        <h2 className="font-bold text-[#001E2B] text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

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

  // Merge saved field config with defaults
  const fields = { ...DEFAULT_FIELDS, ...(opp?.applicationFields || {}) };
  const show = (key) => fields[key] !== 'hidden';
  const req  = (key) => fields[key] === 'required';

  const onSubmit = async (data) => {
    if (req('cv') && !cvUrl) { toast.error('Please upload your CV / Resume.'); return; }
    if (req('idDocument') && !idUrl) { toast.error('Please upload your ID or Passport.'); return; }
    setSubmitting(true);
    try {
      await opportunityApi.apply(id, {
        ...data,
        languages: show('languages') ? languages : [],
        cvUrl: show('cv') ? cvUrl : undefined,
        idDocumentUrl: show('idDocument') ? idUrl : undefined,
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

  const showDocumentsCard    = show('cv') || show('idDocument');
  const showApplicationCard  = show('coverLetter') || show('experience') || show('availableFrom') || show('hoursPerWeek');
  const showEmergencyCard    = show('emergencyContact');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/dashboard/opportunities/${id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Opportunity
        </button>
        <h1 className="page-header">Apply — {opp.title}</h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[260px,1fr] gap-6 items-start">

        {/* Left: sticky opportunity summary */}
        <div className="sticky top-6 flex flex-col gap-4">
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{opp.title}</h3>
            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                {opp.community}{opp.district && `, ${opp.district}`}
              </span>
              {opp.startDate && (
                <span className="flex items-center gap-2">
                  <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                  Starts {formatDate(opp.startDate)}
                </span>
              )}
              {opp.endDate && (
                <span className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-400 flex-shrink-0" />
                  Ends {formatDate(opp.endDate)}
                </span>
              )}
              {opp.slots && (
                <span className="flex items-center gap-2">
                  <Users size={12} className="text-gray-400 flex-shrink-0" />
                  {opp.slots} slot{opp.slots !== 1 ? 's' : ''} available
                </span>
              )}
            </div>

            {opp.skills?.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Skills needed</p>
                <div className="flex flex-wrap gap-1.5">
                  {opp.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 px-1">
            Fields marked <span className="text-red-400 font-medium">*</span> are required.
            Your data is stored securely and only shared with the opportunity organizer.
          </p>
        </div>

        {/* Right: form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Section 1: Personal Information — always shown */}
        <div className="card p-5 flex flex-col gap-4">
          <SectionHeader icon={User} title="Personal Information" />

          {/* Name + Email always collected */}
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

          {/* Phone + LinkedIn — conditional */}
          {(show('phone') || show('linkedin')) && (
            <div className={cn('grid gap-4', show('phone') && show('linkedin') ? 'grid-cols-2' : 'grid-cols-1')}>
              {show('phone') && (
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+250 7XX XXX XXX"
                  required={req('phone')}
                  error={errors.phone?.message}
                  {...register('phone', req('phone') ? { required: 'Phone number is required' } : {})}
                />
              )}
              {show('linkedin') && (
                <Input
                  label="LinkedIn Profile"
                  placeholder="linkedin.com/in/your-profile"
                  hint={req('linkedin') ? undefined : 'Optional'}
                  required={req('linkedin')}
                  error={errors.linkedIn?.message}
                  {...register('linkedIn', req('linkedin') ? { required: 'LinkedIn is required' } : {})}
                />
              )}
            </div>
          )}

          {/* Languages — conditional */}
          {show('languages') && (
            <div>
              <label className="text-sm font-medium text-[#001E2B] block mb-2">
                Languages Spoken
                {req('languages')
                  ? <span className="text-red-400 ml-0.5">*</span>
                  : <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all border',
                      languages.includes(lang)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Documents — conditional */}
        {showDocumentsCard && (
          <div className="card p-5 flex flex-col gap-4">
            <SectionHeader
              icon={FileText}
              title="Documents"
              subtitle={
                show('cv') && show('idDocument')
                  ? req('cv') && req('idDocument') ? 'Both documents are required' : 'Upload requested documents'
                  : 'Upload the requested document'
              }
            />
            <div className={cn('grid gap-4', show('cv') && show('idDocument') ? 'grid-cols-2' : 'grid-cols-1')}>
              {show('cv') && (
                <DocUpload
                  label="CV / Resume"
                  required={req('cv')}
                  hint="PDF, DOC, DOCX — max 5 MB"
                  accept=".pdf,.doc,.docx"
                  folder="applications/cv"
                  onUploaded={setCvUrl}
                />
              )}
              {show('idDocument') && (
                <DocUpload
                  label="National ID / Passport"
                  required={req('idDocument')}
                  hint="PDF, JPG, PNG — max 5 MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                  folder="applications/id"
                  onUploaded={setIdUrl}
                />
              )}
            </div>
          </div>
        )}

        {/* Section 3: Application — conditional */}
        {showApplicationCard && (
          <div className="card p-5 flex flex-col gap-4">
            <SectionHeader
              icon={Mail}
              title="Your Application"
              subtitle="Tell the organizer why you're the right fit"
            />

            {show('coverLetter') && (
              <Textarea
                label="Cover Letter"
                required={req('coverLetter')}
                placeholder="Introduce yourself and explain why you'd like to volunteer for this opportunity."
                rows={5}
                error={errors.coverLetter?.message}
                {...register('coverLetter', req('coverLetter')
                  ? { required: 'A cover letter is required', minLength: { value: 50, message: 'Please write at least 50 characters' } }
                  : {}
                )}
              />
            )}

            {show('experience') && (
              <Textarea
                label="Relevant Skills & Experience"
                required={req('experience')}
                placeholder="Describe your background or previous volunteer experience relevant to this opportunity…"
                rows={4}
                error={errors.experience?.message}
                {...register('experience', req('experience') ? { required: 'Please describe your relevant experience' } : {})}
              />
            )}

            {(show('availableFrom') || show('hoursPerWeek')) && (
              <div className={cn('grid gap-4', show('availableFrom') && show('hoursPerWeek') ? 'grid-cols-2' : 'grid-cols-1')}>
                {show('availableFrom') && (
                  <Input
                    label="Available From"
                    type="date"
                    required={req('availableFrom')}
                    hint="When can you start?"
                    {...register('availableFrom', req('availableFrom') ? { required: 'Please provide your start availability' } : {})}
                  />
                )}
                {show('hoursPerWeek') && (
                  <Input
                    label="Hours Per Week"
                    type="number"
                    min={1}
                    max={40}
                    placeholder="e.g. 10"
                    required={req('hoursPerWeek')}
                    hint="How many hours can you commit weekly?"
                    {...register('hoursPerWeek', req('hoursPerWeek') ? { required: 'Please specify hours per week' } : {})}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Emergency Contact — conditional */}
        {showEmergencyCard && (
          <div className="card p-5 flex flex-col gap-4">
            <SectionHeader
              icon={Phone}
              title="Emergency Contact"
              subtitle={req('emergencyContact') ? 'Required for this opportunity' : 'Optional — used only in case of emergency during in-person activities'}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Full Name"
                placeholder="e.g. Marie Uwimana"
                required={req('emergencyContact')}
                {...register('emergencyContactName', req('emergencyContact') ? { required: 'Emergency contact name is required' } : {})}
              />
              <Input
                label="Contact Phone"
                type="tel"
                placeholder="+250 7XX XXX XXX"
                required={req('emergencyContact')}
                {...register('emergencyContactPhone', req('emergencyContact') ? { required: 'Emergency contact phone is required' } : {})}
              />
            </div>
          </div>
        )}

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

      </div>{/* end two-column grid */}
    </div>
  );
}
