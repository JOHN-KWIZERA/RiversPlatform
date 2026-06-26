import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import RiversMark from '../../components/ui/RiversMark';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const TESTIMONIALS = [
  { quote: 'RIVERS helped our community raise funds for a new school in under 3 months.', name: 'Marie U.', role: 'Community Leader, Gasabo' },
  { quote: 'Every franc I donate goes exactly where it was promised. That trust is everything.', name: 'Amahoro F.', role: 'Sponsor, Kigali' },
  { quote: 'I found meaningful volunteer work in my neighbourhood through the platform.', name: 'Jean-Paul K.', role: 'Volunteer, Nyarugenge' },
];

export default function Login() {
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Invalid credentials. Please try again.');
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
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#001E2B] h-14 flex items-center px-6 sm:px-10 justify-between flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <RiversMark size={32} />
          <span className="font-black text-white tracking-tight">RIVERS</span>
        </Link>
        <p className="text-sm text-[#889397]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white font-semibold hover:text-brand-400 transition-colors">Get started</Link>
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid lg:grid-cols-5 gap-10 items-start">

        {/* ── LEFT — visuals ── */}
        <div className="hidden lg:flex lg:col-span-2 flex-col gap-5">
          <div>
            <h1 className="text-2xl font-black text-[#001E2B]">{t('auth.login_title')}</h1>
            <p className="text-gray-500 text-sm mt-1">Good to have you back.</p>
          </div>

          {/* Community photo */}
          <div className="relative rounded-2xl overflow-hidden h-44">
            <img
              src="https://picsum.photos/seed/rivers/600/350"
              alt="Community"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B]/80 via-[#001E2B]/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm font-bold">85+ verified campaigns</p>
              <p className="text-white/60 text-xs mt-0.5">Transparently funded across Rwanda</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="flex flex-col gap-2">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-600 leading-relaxed italic">"{quote}"</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-black">{name[0]}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#001E2B]">{name}</p>
                    <p className="text-[10px] text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — form ── */}
        <div className="lg:col-span-3 flex items-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5 w-full">
            <div>
              <h2 className="text-xl font-black text-[#001E2B]">Sign in to your account</h2>
              <p className="text-gray-500 text-sm mt-0.5">{t('auth.login_sub')}</p>
            </div>

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
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="you@example.com"
                leftElement={<Mail size={15} />}
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <Input
                label={t('auth.password')}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                leftElement={<Lock size={15} />}
                rightElement={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="cursor-pointer">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', { required: 'Password is required' })}
              />
              <div className="flex justify-end -mt-1">
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">{t('auth.forgot')}</Link>
              </div>
              <Button type="submit" loading={loading} size="lg" className="w-full">
                {t('auth.login_btn')}
              </Button>
            </form>

            <p className="text-sm text-center text-gray-500">
              {t('auth.no_account')}{' '}
              <Link to="/signup" className="text-brand-600 font-semibold hover:underline">{t('nav.signup')}</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
