import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { User, Lock, Globe2, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import Input, { Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'language', label: 'Language', icon: Globe2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fullName: user?.fullName, phone: user?.phone, location: user?.location, organisation: user?.organisation, community: user?.community },
  });

  const onSave = async (data) => {
    setLoading(true);
    try {
      await authApi.updateProfile(data);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('rivers_lang', lang);
    toast.success(`Language changed to ${lang === 'en' ? 'English' : 'Kinyarwanda'}`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="page-header">{t('dashboard.settings')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 flex flex-col gap-5">
          {/* Avatar area */}
          <div className="flex items-center gap-4">
            <Avatar name={user?.fullName} size="xl" />
            <div>
              <p className="font-semibold text-[#1a1a2e]">{user?.fullName}</p>
              <p className="text-sm text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              <button className="text-xs text-brand-600 hover:underline mt-1">Change photo</button>
            </div>
          </div>
          <hr className="border-gray-100" />
          <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
            <Input label="Full Name" {...register('fullName', { required: true })} error={errors.fullName?.message} />
            <Input label="Phone" type="tel" placeholder="+250 7XX XXX XXX" {...register('phone')} />
            <Input label="Location" placeholder="e.g. Kigali, Rwanda" {...register('location')} />
            {user?.role === 'sponsor' && <Input label="Organisation" {...register('organisation')} />}
            {user?.role === 'community_leader' && <Input label="Community" {...register('community')} />}
            <Button type="submit" loading={loading}>{t('common.save')}</Button>
          </form>
        </div>
      )}

      {tab === 'language' && (
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1a1a2e]">Display Language</h3>
          <div className="flex flex-col gap-3">
            {[
              { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
              { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda', flag: '🇷🇼' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleLang(lang.code)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${i18n.language === lang.code ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-200'}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-semibold text-[#1a1a2e]">{lang.native}</p>
                  <p className="text-xs text-gray-400">{lang.name}</p>
                </div>
                {i18n.language === lang.code && <span className="ml-auto text-brand-500 text-xs font-bold">Active</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1a1a2e]">Notification Preferences</h3>
          {[
            { label: 'Campaign updates', desc: 'When campaigns you support post updates' },
            { label: 'New donations', desc: 'When your campaign receives a donation' },
            { label: 'Impact reports', desc: 'When impact reports are published' },
            { label: 'Platform announcements', desc: 'Important platform news and updates' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[#1a1a2e]">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
