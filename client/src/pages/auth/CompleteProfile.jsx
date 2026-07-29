import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Phone, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import RiversMark from '../../components/ui/RiversMark';
import RoleSelector from '../../components/auth/RoleSelector';
import { useAuth } from '../../context/AuthContext';

export default function CompleteProfile() {
  const { t } = useTranslation();
  const { supabaseUser, completeGoogleProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { role: 'sponsor' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    if (!data.role) {
      toast.error('Choose a role to continue.');
      return;
    }
    setLoading(true);
    try {
      await completeGoogleProfile({
        roles: [data.role],
        organisation: data.organisation,
        community: data.community,
        phone: data.phone,
        fullName: supabaseUser?.user_metadata?.full_name,
      });
      toast.success('Account created! Welcome to RIVERS.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Could not finish setting up your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <header className="bg-[#001E2B] h-14 flex items-center px-6 sm:px-10 flex-shrink-0">
        <RiversMark size={32} />
        <span className="ml-2.5 font-black text-white tracking-tight">RIVERS</span>
      </header>

      <div className="flex-1 max-w-xl w-full mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-black text-[#001E2B]">One last step</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Tell us how you'd like to participate in RIVERS.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">I am a…</p>
              <RoleSelector selectedRole={selectedRole} register={register} t={t} />
            </div>

            <Input
              label={t('auth.phone')}
              type="tel"
              leftElement={<Phone size={15} />}
              placeholder="+250 7XX XXX XXX"
              {...register('phone')}
            />

            {selectedRole === 'community_leader' && (
              <Input
                label={t('auth.community')}
                leftElement={<MapPin size={15} />}
                placeholder="e.g. Bumbogo, Gasabo"
                {...register('community')}
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
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
