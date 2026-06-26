import { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Megaphone, Heart, Users, FileText,
  Settings, LogOut, ChevronLeft, Handshake, Star, Repeat2, ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import RiversMark from '../ui/RiversMark';
import toast from 'react-hot-toast';

const ROLE_NAVS = {
  admin: [
    { to: '/dashboard',               label: 'dashboard.overview',      icon: LayoutDashboard },
    { to: '/dashboard/campaigns',     label: 'dashboard.campaigns',     icon: Megaphone,    section: 'Content' },
    { to: '/dashboard/opportunities', label: 'dashboard.opportunities', icon: Handshake },
    { to: '/dashboard/reports',       label: 'dashboard.reports',       icon: FileText },
    { to: '/dashboard/users',         label: 'dashboard.users',         icon: Users,        section: 'Platform' },
    { to: '/dashboard/audit',         label: 'dashboard.audit',         icon: ShieldCheck },
  ],
  community_leader: [
    { to: '/dashboard',               label: 'dashboard.overview',      icon: LayoutDashboard },
    { to: '/dashboard/campaigns',     label: 'dashboard.campaigns',     icon: Megaphone },
    { to: '/dashboard/opportunities', label: 'dashboard.opportunities', icon: Handshake },
    { to: '/dashboard/reports',       label: 'dashboard.reports',       icon: FileText },
  ],
  sponsor: [
    { to: '/dashboard',             label: 'dashboard.overview',  icon: LayoutDashboard },
    { to: '/dashboard/browse',      label: 'nav.campaigns',       icon: Star,     section: 'Giving' },
    { to: '/dashboard/donations',   label: 'dashboard.donations', icon: Heart },
    { to: '/dashboard/recurring',   label: 'nav.recurring',       icon: Repeat2 },
    { to: '/dashboard/reports',     label: 'dashboard.reports',   icon: FileText },
  ],
  volunteer: [
    { to: '/dashboard',               label: 'dashboard.overview',      icon: LayoutDashboard },
    { to: '/dashboard/opportunities', label: 'dashboard.opportunities', icon: Handshake },
  ],
  beneficiary: [
    { to: '/dashboard',     label: 'dashboard.overview', icon: LayoutDashboard },
    { to: '/dashboard/aid', label: 'common.view_all',    icon: Heart },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const { t } = useTranslation();
  const { user, logout, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const navItems = ROLE_NAVS[effectiveRole] || ROLE_NAVS[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>

      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="flex items-center h-14 border-b border-gray-200 flex-shrink-0">
        {collapsed ? (
          <button
            onClick={onToggle}
            className="flex-1 flex items-center justify-center h-full hover:bg-gray-50 transition-colors group"
            title="Expand sidebar"
          >
            <RiversMark size={32} className="shadow-warm" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4">
              <RiversMark size={32} className="flex-shrink-0 shadow-warm" />
              <div className="min-w-0">
                <p className="font-black text-gray-900 tracking-tight text-sm leading-none">RIVERS</p>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">Platform</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 mr-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors hidden lg:flex flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* ── Main nav ──────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto sidebar-scroll">
        {navItems.map(({ to, label, icon: Icon, section }) => (
          <Fragment key={to}>
            {section && !collapsed && (
              <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 first:pt-1">
                {section}
              </p>
            )}
            <NavLink
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-0')
              }
              title={collapsed ? t(label) : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{t(label)}</span>}
            </NavLink>
          </Fragment>
        ))}
      </nav>

      {/* ── Settings ──────────────────────────────────────────── */}
      <div className="px-2 py-2 border-t border-gray-200 flex-shrink-0">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-0')
          }
          title={collapsed ? t('dashboard.settings') : undefined}
        >
          <Settings size={17} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">{t('dashboard.settings')}</span>}
        </NavLink>
      </div>

      {/* ── Logout ────────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-400',
            'hover:text-red-500 hover:bg-red-50 transition-all w-full',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
