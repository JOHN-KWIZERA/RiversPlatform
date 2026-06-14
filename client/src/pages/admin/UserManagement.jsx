import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShieldCheck, ShieldOff, Mail } from 'lucide-react';
import Input, { Select } from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { statusColor } from '../../lib/utils';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK_USERS = [
  { _id: '1', fullName: 'Marie Uwimana', email: 'marie@example.rw', role: 'community_leader', community: 'Bumbogo', isVerified: true, createdAt: new Date('2026-01-15') },
  { _id: '2', fullName: 'Jean Paul Habimana', email: 'jp@example.rw', role: 'community_leader', community: 'Kimironko', isVerified: true, createdAt: new Date('2026-02-03') },
  { _id: '3', fullName: 'Amahoro Foundation', email: 'amahoro@example.rw', role: 'sponsor', organisation: 'Amahoro Foundation', isVerified: true, createdAt: new Date('2026-01-28') },
  { _id: '4', fullName: 'Diane Mukansanga', email: 'diane@example.rw', role: 'volunteer', isVerified: false, createdAt: new Date('2026-03-10') },
  { _id: '5', fullName: 'Patrick Nkurunziza', email: 'patrick@example.rw', role: 'community_leader', community: 'Nyamirambo', isVerified: false, createdAt: new Date('2026-04-05') },
  { _id: '6', fullName: 'Solange Iradukunda', email: 'solange@example.rw', role: 'beneficiary', isVerified: false, createdAt: new Date('2026-04-18') },
];

const ROLE_COLORS = {
  admin: 'bg-[#1a1a2e] text-white',
  community_leader: 'bg-brand-50 text-brand-700',
  sponsor: 'bg-forest-50 text-forest-700',
  volunteer: 'bg-blue-50 text-blue-700',
  beneficiary: 'bg-amber-50 text-amber-700',
};

export default function UserManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = MOCK_USERS.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const toggleVerify = (user) => {
    toast.success(`${user.isVerified ? 'Unverified' : 'Verified'}: ${user.fullName}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.users')}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and verify platform users across all roles.</p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {['all', 'community_leader', 'sponsor', 'volunteer', 'beneficiary'].map((r) => {
          const count = r === 'all' ? MOCK_USERS.length : MOCK_USERS.filter((u) => u.role === r).length;
          return (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn('px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
                roleFilter === r ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200')}
            >
              {r === 'all' ? 'All Users' : t(`auth.roles.${r}`)}
              <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold', roleFilter === r ? 'bg-white/20' : 'bg-gray-100')}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <Input placeholder="Search by name or email…" leftElement={<Search size={15} />} value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50/60 border-b border-brand-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Community / Org</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} size="sm" />
                      <div>
                        <p className="font-semibold text-[#1a1a2e]">{u.fullName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`badge ${ROLE_COLORS[u.role]}`}>{t(`auth.roles.${u.role}`)}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">
                    {u.community || u.organisation || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified
                      ? <span className="badge bg-forest-50 text-forest-700 border border-forest-200"><ShieldCheck size={10} /> Verified</span>
                      : <span className="badge bg-gray-100 text-gray-500">Unverified</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleVerify(u)}
                      className={cn('p-1.5 rounded-lg transition-colors', u.isVerified ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-forest-50 text-forest-600 hover:bg-forest-100')}
                      title={u.isVerified ? 'Unverify' : 'Verify'}
                    >
                      {u.isVerified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
