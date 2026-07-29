import { Users, Heart, Handshake, Home } from 'lucide-react';

export const ROLES = ['community_leader', 'sponsor', 'volunteer', 'beneficiary'];

export const ROLE_META = {
  community_leader: { icon: Users,     color: 'bg-brand-500',  activeText: 'text-brand-700',  desc: 'Verify beneficiaries & launch campaigns' },
  sponsor:          { icon: Heart,     color: 'bg-forest-500', activeText: 'text-forest-700', desc: 'Fund verified community campaigns' },
  volunteer:        { icon: Handshake, color: 'bg-amber-500',  activeText: 'text-amber-700',  desc: 'Donate your time & skills' },
  beneficiary:      { icon: Home,      color: 'bg-blue-500',   activeText: 'text-blue-700',   desc: 'Access community support' },
};

export default function RoleSelector({ selectedRole, register, t }) {
  return (
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
  );
}
