import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err?.message || 'Failed to send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-md bg-brand-500 flex items-center justify-center">
            <span className="text-white text-sm font-black">R</span>
          </div>
          <span className="font-black text-[#001E2B] text-lg tracking-tight">RIVERS</span>
        </Link>

        {sent ? (
          <div className="card p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#001E2B]">Check your email</h2>
              <p className="text-gray-500 text-sm mt-2">
                We sent a password reset link to <strong>{getValues('email')}</strong>.
                Check your inbox and follow the instructions.
              </p>
            </div>
            <Link to="/login">
              <Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black text-[#001E2B] mb-1">Reset password</h1>
            <p className="text-gray-500 mb-8">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftElement={<Mail size={15} />}
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <Button type="submit" loading={loading} size="lg" className="w-full">
                Send reset link
              </Button>
            </form>

            <p className="text-sm text-center text-gray-500 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
