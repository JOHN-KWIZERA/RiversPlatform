import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShieldCheck, ShieldOff, Mail } from 'lucide-react';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { userApi } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:            'bg-[#001E2B] text-white',
  community_leader: 'bg-brand-50 text-brand-700',
  sponsor:          'bg-forest-50 text-forest-700',
  volunteer:        'bg-blue-50 text-blue-700',
  beneficiary:      'bg-amber-50 text-amber-700',
};

const ROLES = ['all', 'community_leader', 'sponsor', 'volunteer', 'beneficiary'];

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    userApi.getAll({ limit: 100 })
      .then(res => setUsers(res.users || []))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const toggleVerify = async (user) => {
    setVerifyingId(user._id);
    try {
      await userApi.verify(user._id, !user.isVerified);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isVerified: !u.isVerified } : u));
      toast.success(`${user.fullName} ${user.isVerified ? 'unverified' : 'verified'}.`);
    } catch {
      toast.error('Failed to update verification.');
    } finally {
      setVerifyingId(null);
    }
  };

  const countFor = (role) => role === 'all' ? users.length : users.filter(u => u.role === role).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">{t('dashboard.users')}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and verify platform users across all roles.</p>
      </div>

      {/* Role filter badges */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={cn(
              'px-3 py-2 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5',
              roleFilter === r
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
            )}
          >
            {r === 'all' ? 'All Users' : t(`auth.roles.${r}`)}
            <span className={cn('px-1.5 py-0.5 rounded-sm text-[10px] font-bold', roleFilter === r ? 'bg-white/20' : 'bg-gray-100')}>
              {countFor(r)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or email…"
        leftElement={<Search size={15} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} className="text-brand-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Community / Org</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} size="sm" />
                        <div>
                          <p className="font-semibold text-[#001E2B]">{u.fullName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10} />{u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`auth.roles.${u.role}`) || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">
                      {u.community || u.organisation || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.isVerified
                        ? <span className="badge bg-brand-50 text-brand-700 border border-brand-200"><ShieldCheck size={10} /> Verified</span>
                        : <span className="badge bg-gray-100 text-gray-500">Unverified</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleVerify(u)}
                        disabled={verifyingId === u._id}
                        className={cn(
                          'p-1.5 rounded-md transition-colors disabled:opacity-50',
                          u.isVerified
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                        )}
                        title={u.isVerified ? 'Unverify' : 'Verify'}
                      >
                        {u.isVerified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-12 text-sm">
                {users.length === 0 ? 'No users registered yet.' : 'No users match your search.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
