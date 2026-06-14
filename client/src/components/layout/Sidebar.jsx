import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Megaphone, Heart, BarChart3, Users, FileText,
  Settings, LogOut, ChevronLeft, ChevronRight, Handshake, Star,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_NAVS = {
  admin: [
    { to: '/dashboard', label: 'dashboard.overview', icon: LayoutDashboard },
    { to: '/dashboard/campaigns', label: 'dashboard.campaigns', icon: Megaphone },
    { to: '/dashboard/users', label: 'dashboard.users', icon: Users },
    { to: '/dashboard/analytics', label: 'dashboard.analytics', icon: BarChart3 },
    { to: '/dashboard/reports', label: 'dashboard.reports', icon: FileText },
  ],
  community_leader: [
    { to: '/dashboard', label: 'dashboard.overview', icon: LayoutDashboard },
    { to: '/dashboard/campaigns', label: 'dashboard.campaigns', icon: Megaphone },
    { to: '/dashboard/reports', label: 'dashboard.reports', icon: FileText },
    { to: '/dashboard/analytics', label: 'dashboard.analytics', icon: BarChart3 },
  ],
  sponsor: [
    { to: '/dashboard', label: 'dashboard.overview', icon: LayoutDashboard },
    { to: '/dashboard/browse', label: 'nav.campaigns', icon: Star },
    { to: '/dashboard/donations', label: 'dashboard.donations', icon: Heart },
    { to: '/dashboard/reports', label: 'dashboard.reports', icon: FileText },
  ],
  volunteer: [
    { to: '/dashboard', label: 'dashboard.overview', icon: LayoutDashboard },
    { to: '/dashboard/opportunities', label: 'nav.campaigns', icon: Handshake },
  ],
  beneficiary: [
    { to: '/dashboard', label: 'dashboard.overview', icon: LayoutDashboard },
    { to: '/dashboard/aid', label: 'common.view_all', icon: Heart },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = ROLE_NAVS[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <aside className={cn(
      'flex flex-col h-full bg-[#001E2B] border-r border-white/[0.07] transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center px-4 h-16 border-b border-white/[0.07]', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center shadow-warm">
              <span className="text-white text-xs font-black">R</span>
            </div>
            <span className="font-black text-white tracking-tight">RIVERS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center shadow-warm">
            <span className="text-white text-xs font-black">R</span>
          </div>
        )}
        <button onClick={onToggle} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 transition-colors hidden lg:flex">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto sidebar-scroll">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-0')}
            title={collapsed ? t(label) : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t(label)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/[0.07] flex flex-col gap-1">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) => cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-0')}
          title={collapsed ? t('dashboard.settings') : undefined}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>{t('dashboard.settings')}</span>}
        </NavLink>

        {/* User */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 mt-1 border border-white/[0.07]">
            <Avatar name={user?.fullName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn('sidebar-link text-red-400 hover:bg-red-500/10 hover:text-red-400 mt-0.5', collapsed && 'justify-center px-0')}
          title={collapsed ? t('dashboard.logout') : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>{t('dashboard.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
