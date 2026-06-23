import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, MapPin, Users, Heart, Handshake, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['community_leader', 'sponsor', 'volunteer', 'beneficiary'];

const ROLE_META = {
  community_leader: { icon: Users,    color: 'bg-brand-500',  activeText: 'text-brand-700', desc: 'Verify beneficiaries & launch campaigns' },
  sponsor:          { icon: Heart,    color: 'bg-forest-500', activeText: 'text-forest-700', desc: 'Fund verified community campaigns' },
  volunteer:        { icon: Handshake,color: 'bg-amber-500',  activeText: 'text-amber-700', desc: 'Donate your time & skills' },
  beneficiary:      { icon: Home,     color: 'bg-blue-500',   activeText: 'text-blue-700',  desc: 'Access community support' },
};

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Signup() {
  const { t } = useTranslation();
  const { register: authRegister, registerWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: searchParams.get('role') || 'sponsor' },
    shouldUnregister: true,
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authRegister(data);
      toast.success('Account created! Welcome to RIVERS.');
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
      const { role, organisation, community, phone } = watch();
      await registerWithGoogle({ role, organisation, community, phone });
      toast.success('Account created! Welcome to RIVERS.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#001E2B] h-14 flex items-center px-6 sm:px-10 justify-between flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">R</span>
          </div>
          <span className="font-black text-white tracking-tight">RIVERS</span>
        </Link>
        <p className="text-sm text-[#889397]">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-semibold hover:text-brand-400 transition-colors">Sign in</Link>
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid lg:grid-cols-5 gap-10 items-start">

        {/* ── LEFT — role selection + visuals ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-black text-[#001E2B]">{t('auth.signup_title')}</h1>
            <p className="text-gray-500 text-sm mt-1">Choose how you want to participate.</p>
          </div>

          {/* Community photo */}
          <div className="relative rounded-2xl overflow-hidden h-44">
            <img
              src="https://picsum.photos/seed/kigali/600/350"
              alt="Community"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B]/80 via-[#001E2B]/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm font-bold">1,247+ families supported</p>
              <p className="text-white/60 text-xs mt-0.5">Across Kigali and Rwanda</p>
            </div>
          </div>

          {/* Role cards */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">I am a…</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const { icon: Icon, color, activeText, desc } = ROLE_META[r];
                const active = selectedRole === r;
                return (
                  <label
                    key={r}
                    className={`flex flex-col gap-2.5 p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                      active ? 'bg-white border-brand-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" value={r} {...register('role')} className="sr-only" />
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? color : 'bg-gray-100'}`}>
                      <Icon size={17} className={active ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${active ? activeText : 'text-[#001E2B]'}`}>
                        {t(`auth.roles.${r}`)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT — form ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-black text-[#001E2B]">Your details</h2>
              <p className="text-gray-500 text-sm mt-0.5">Fill in your information to get started.</p>
            </div>

            {/* Google */}
            <Button
              variant="secondary"
              className="w-full"
              loading={googleLoading}
              onClick={handleGoogle}
              leftIcon={GOOGLE_SVG}
            >
              {t('auth.google')}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('auth.full_name')}
                  leftElement={<User size={15} />}
                  placeholder="Marie Uwimana"
                  error={errors.fullName?.message}
                  {...register('fullName', { required: 'Full name is required' })}
                />
                <Input
                  label={t('auth.phone')}
                  type="tel"
                  leftElement={<Phone size={15} />}
                  placeholder="+250 7XX XXX XXX"
                  {...register('phone')}
                />
              </div>

              <Input
                label={t('auth.email')}
                type="email"
                leftElement={<Mail size={15} />}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />

              <Input
                label={t('auth.password')}
                type={showPw ? 'text' : 'password'}
                leftElement={<Lock size={15} />}
                placeholder="Min. 8 characters"
                rightElement={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="cursor-pointer">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              />

              {selectedRole === 'community_leader' && (
                <Input
                  label={t('auth.community')}
                  leftElement={<MapPin size={15} />}
                  placeholder="e.g. Bumbogo, Gasabo"
                  error={errors.community?.message}
                  {...register('community', { required: 'Community is required for leaders' })}
                />
              )}
              {selectedRole === 'sponsor' && (
                <Input
                  label={t('auth.organisation')}
                  leftElement={<Building2 size={15} />}
                  placeholder="Optional — company or NGO"
                  {...register('organisation')}
                />
              )}

              <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
                {t('auth.signup_btn')}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-400 leading-relaxed">
              By creating an account you agree to our Terms of Service and Privacy Policy.
              RIVERS complies with Rwanda Law No. 058/2021 on Data Protection.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
