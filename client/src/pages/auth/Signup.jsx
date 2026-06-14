import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['community_leader', 'sponsor', 'volunteer', 'beneficiary'];

const ROLE_ICONS = {
  community_leader: '👥',
  sponsor: '💛',
  volunteer: '🤝',
  beneficiary: '🏡',
};

export default function Signup() {
  const { t } = useTranslation();
  const { register: authRegister, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: searchParams.get('role') || 'sponsor' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authRegister(data);
      toast.success('Account created! Welcome to RIVERS 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-forest-700 to-forest-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-10" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white text-sm font-black">R</span>
            </div>
            <span className="font-black text-white text-lg tracking-tight">RIVERS</span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white mb-3">Become part of Rwanda's community impact movement</h2>
          <p className="text-forest-200 text-sm leading-relaxed">
            Join community leaders, sponsors, and volunteers across Kigali who are building transparent, accountable support systems for vulnerable families.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <div key={r} className={`p-3 rounded-xl border transition-all ${selectedRole === r ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10'}`}>
                <span className="text-lg">{ROLE_ICONS[r]}</span>
                <p className="text-white text-xs font-semibold mt-1">{t(`auth.roles.${r}`)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-forest-300 text-xs">
          Aligned with Rwanda Vision 2050 · RISA compliant · SDG 8, 10 & 17
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 pt-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white text-sm font-black">R</span>
            </div>
            <span className="font-black text-[#1a1a2e] text-lg tracking-tight">RIVERS</span>
          </Link>

          <h1 className="text-3xl font-black text-[#1a1a2e] mb-1">{t('auth.signup_title')}</h1>
          <p className="text-gray-500 mb-6">{t('auth.signup_sub')}</p>

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-sm font-medium text-[#1a1a2e] mb-2">{t('auth.role')}</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === r
                      ? 'bg-brand-50 border-brand-400 text-brand-700'
                      : 'bg-white border-gray-200 hover:border-brand-200'
                  }`}
                >
                  <input type="radio" value={r} {...register('role')} className="sr-only" />
                  <span className="text-base">{ROLE_ICONS[r]}</span>
                  <span className="text-xs font-semibold">{t(`auth.roles.${r}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full mb-5"
            loading={googleLoading}
            onClick={handleGoogle}
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            }
          >
            {t('auth.google')}
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label={t('auth.full_name')} leftElement={<User size={15} />} placeholder="e.g. Marie Uwimana" required
              error={errors.fullName?.message} {...register('fullName', { required: 'Full name is required' })} />

            <Input label={t('auth.email')} type="email" leftElement={<Mail size={15} />} placeholder="you@example.com" required
              error={errors.email?.message} {...register('email', { required: 'Email is required' })} />

            <Input label={t('auth.password')} type={showPw ? 'text' : 'password'} leftElement={<Lock size={15} />}
              placeholder="Min. 8 characters"
              rightElement={<button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
              error={errors.password?.message}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />

            <Input label={t('auth.phone')} type="tel" leftElement={<Phone size={15} />} placeholder="+250 7XX XXX XXX"
              {...register('phone')} />

            {(selectedRole === 'community_leader') && (
              <Input label={t('auth.community')} leftElement={<MapPin size={15} />} placeholder="e.g. Bumbogo, Gasabo" required
                error={errors.community?.message} {...register('community', { required: 'Community is required for leaders' })} />
            )}

            {(selectedRole === 'sponsor') && (
              <Input label={t('auth.organisation')} leftElement={<Building2 size={15} />} placeholder="Optional — company or NGO" {...register('organisation')} />
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              {t('auth.signup_btn')}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
            By creating an account you agree to our Terms of Service and Privacy Policy. RIVERS complies with Rwanda Law No. 058/2021 on Data Protection.
          </p>

          <p className="text-sm text-center text-gray-500 mt-4">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('auth.login_btn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
