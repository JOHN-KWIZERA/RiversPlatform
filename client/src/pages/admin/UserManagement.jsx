import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, ShieldCheck, ShieldOff, Mail, MoreVertical,
  UserCog, Trash2, Ban, CheckCircle2,
} from 'lucide-react';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { userApi, auditApi } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:            'bg-[#001E2B] text-white',
  community_leader: 'bg-brand-50 text-brand-700',
  sponsor:          'bg-forest-50 text-forest-700',
  volunteer:        'bg-blue-50 text-blue-700',
  beneficiary:      'bg-amber-50 text-amber-700',
};

const ALL_ROLES = ['admin', 'community_leader', 'sponsor', 'volunteer', 'beneficiary'];
const FILTER_ROLES = ['all', 'community_leader', 'sponsor', 'volunteer', 'beneficiary'];

function ActionMenu({ user, onVerify, onChangeRole, onSuspend, onDelete }) {
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setRoleOpen(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex items-center justify-end gap-1" ref={ref}>
      {/* Verify toggle — always visible */}
      <button
        onClick={() => onVerify(user)}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          user.isVerified
            ? 'bg-red-50 text-red-500 hover:bg-red-100'
            : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
        )}
        title={user.isVerified ? 'Unverify' : 'Verify'}
      >
        {user.isVerified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
      </button>

      {/* More actions dropdown */}
      <button
        onClick={() => { setOpen(o => !o); setRoleOpen(false); }}
        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        title="More actions"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">

          {/* Change role */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setRoleOpen(r => !r)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCog size={13} className="text-gray-400" /> Change Role
            </button>
            {roleOpen && (
              <div className="border-t border-gray-100 bg-gray-50">
                {ALL_ROLES.filter(r => r !== user.role).map(r => (
                  <button
                    key={r}
                    onClick={() => { onChangeRole(user, r); setOpen(false); setRoleOpen(false); }}
                    className="w-full text-left px-5 py-2 text-xs text-gray-600 hover:bg-gray-100 hover:text-brand-600 transition-colors capitalize"
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suspend / Unsuspend */}
          <button
            onClick={() => { onSuspend(user); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            {user.isSuspended
              ? <><CheckCircle2 size={13} className="text-forest-500" /><span className="text-forest-700">Unsuspend</span></>
              : <><Ban size={13} className="text-amber-500" /><span className="text-amber-700">Suspend</span></>
            }
          </button>

          {/* Delete */}
          <button
            onClick={() => { onDelete(user); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} /> Delete user
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

  const handleVerify = async (user) => {
    try {
      await userApi.verify(user._id, !user.isVerified);
      auditApi.log({ action: 'user_verified', targetType: 'user', targetId: user._id, targetLabel: user.fullName, metadata: { verified: !user.isVerified } });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isVerified: !u.isVerified } : u));
      toast.success(`${user.fullName} ${user.isVerified ? 'unverified' : 'verified'}.`);
    } catch {
      toast.error('Failed to update verification.');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      await userApi.changeRole(user._id, newRole);
      auditApi.log({ action: 'role_changed', targetType: 'user', targetId: user._id, targetLabel: user.fullName, metadata: { from: user.role, to: newRole } });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
      toast.success(`${user.fullName} is now a ${newRole.replace('_', ' ')}.`);
    } catch {
      toast.error('Failed to change role.');
    }
  };

  const handleSuspend = async (user) => {
    try {
      await userApi.suspend(user._id, !user.isSuspended);
      auditApi.log({ action: 'user_suspended', targetType: 'user', targetId: user._id, targetLabel: user.fullName, metadata: { suspended: !user.isSuspended } });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isSuspended: !u.isSuspended } : u));
      toast.success(`${user.fullName} ${user.isSuspended ? 'unsuspended' : 'suspended'}.`);
    } catch {
      toast.error('Failed to update suspension.');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) return;
    try {
      await userApi.delete(user._id);
      auditApi.log({ action: 'user_deleted', targetType: 'user', targetId: user._id, targetLabel: user.fullName, metadata: { role: user.role } });
      setUsers(prev => prev.filter(u => u._id !== user._id));
      toast.success(`${user.fullName} deleted.`);
    } catch {
      toast.error('Failed to delete user.');
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
        {FILTER_ROLES.map((r) => (
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u._id} className={cn('hover:bg-gray-50 transition-colors', u.isSuspended && 'opacity-50')}>
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
                      <div className="flex flex-col gap-1">
                        {u.isVerified
                          ? <span className="badge bg-brand-50 text-brand-700 border border-brand-200 w-fit"><ShieldCheck size={10} /> Verified</span>
                          : <span className="badge bg-gray-100 text-gray-500 w-fit">Unverified</span>
                        }
                        {u.isSuspended && (
                          <span className="badge bg-amber-50 text-amber-700 border border-amber-200 w-fit"><Ban size={10} /> Suspended</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        user={u}
                        onVerify={handleVerify}
                        onChangeRole={handleChangeRole}
                        onSuspend={handleSuspend}
                        onDelete={handleDelete}
                      />
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
