import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, Globe2, CheckCircle2, XCircle, Megaphone, Heart, Info, Users, Trash2, Settings, LogOut, ChevronDown, UserCog, ShieldCheck, Star, Handshake, User } from 'lucide-react';
import Sidebar from './Sidebar';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../lib/api';
import { cn, timeAgo } from '../../lib/utils';

const ROLE_LABELS = {
  admin:            'Admin',
  community_leader: 'Community Leader',
  sponsor:          'Sponsor',
  volunteer:        'Volunteer',
  beneficiary:      'Beneficiary',
};

const ROLE_COLORS = {
  admin:            { dot: 'bg-gray-800',    active: 'text-gray-900 bg-gray-100' },
  community_leader: { dot: 'bg-brand-500',   active: 'text-brand-600 bg-brand-50' },
  sponsor:          { dot: 'bg-purple-400',  active: 'text-purple-600 bg-purple-50' },
  volunteer:        { dot: 'bg-blue-400',    active: 'text-blue-600 bg-blue-50' },
  beneficiary:      { dot: 'bg-amber-400',   active: 'text-amber-600 bg-amber-50' },
  default:          { dot: 'bg-gray-400',    active: 'text-gray-700 bg-gray-50' },
};

const TYPE_ICON = {
  campaign_approved:    { Icon: CheckCircle2, color: 'text-forest-600 bg-forest-50' },
  campaign_rejected:    { Icon: Megaphone,    color: 'text-red-500 bg-red-50' },
  donation_received:    { Icon: Heart,        color: 'text-brand-500 bg-brand-50' },
  campaign_milestone:   { Icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
  campaign_created:     { Icon: Megaphone,    color: 'text-brand-500 bg-brand-50' },
  info:                 { Icon: Info,         color: 'text-gray-500 bg-gray-100' },
  application_accepted: { Icon: CheckCircle2, color: 'text-forest-600 bg-forest-50' },
  application_rejected: { Icon: XCircle,      color: 'text-red-500 bg-red-50' },
};
const DEFAULT_ICON = { Icon: Info, color: 'text-gray-500 bg-gray-100' };

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const roleRef = useRef(null);
  const { user, logout, effectiveRole, switchRole, resetRole } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const loadNotifications = useCallback(async () => {
    try {
      const { notifications: list, unreadCount: count } = await notificationApi.getAll();
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000); // poll every minute
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'rw' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('rivers_lang', next);
  };

  const markAllRead = async () => {
    await notificationApi.markRead([]);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (n) => {
    if (!n.read) {
      await notificationApi.markRead([n._id]);
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (n.link) { setNotifOpen(false); navigate(n.link); }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    await notificationApi.delete(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    setUnreadCount(prev => {
      const wasUnread = notifications.find(n => n._id === id && !n.read);
      return wasUnread ? Math.max(0, prev - 1) : prev;
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (roleRef.current && !roleRef.current.contains(e.target)) setRoleOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <div className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-shrink-0 transition-transform duration-300 lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-500">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400">{t('dashboard.welcome')},</p>
              <p className="text-sm font-semibold text-[#001E2B]">{user?.fullName?.split(' ')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role selector — shown for any user with multiple roles */}
            {(user?.roles?.length ?? 0) > 1 && (
              <div className="relative" ref={roleRef}>
                <button
                  onClick={() => setRoleOpen(!roleOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <UserCog size={13} className="text-gray-400" />
                  {ROLE_LABELS[effectiveRole] ?? effectiveRole}
                  <ChevronDown size={11} className={cn('text-gray-400 transition-transform ml-0.5', roleOpen && 'rotate-180')} />
                </button>

                {roleOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-atlas z-50 animate-scale-in overflow-hidden py-1">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Active role
                    </p>
                    {user.roles.map(r => {
                      const isActive = effectiveRole === r;
                      const { dot, active } = ROLE_COLORS[r] ?? ROLE_COLORS.default;
                      return (
                        <button
                          key={r}
                          onClick={() => { r === user.role ? resetRole() : switchRole(r); setRoleOpen(false); }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors',
                            isActive ? `${active} font-semibold` : 'text-gray-700 hover:bg-gray-50',
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />
                          {ROLE_LABELS[r] ?? r}
                          {isActive && <CheckCircle2 size={12} className="ml-auto opacity-70" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Globe2 size={13} />
              {i18n.language === 'en' ? 'EN' : 'RW'}
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-atlas z-50 animate-scale-in overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-[#001E2B]">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-800 hover:underline font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No notifications yet</p>
                      </div>
                    ) : notifications.map((n) => {
                      const { Icon, color } = TYPE_ICON[n.type] || DEFAULT_ICON;
                      return (
                        <div
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          className={cn('group flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer', !n.read && 'bg-gray-50')}
                        >
                          <div className={cn('w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5', color)}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#001E2B]">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                            <button
                              onClick={(e) => deleteNotif(e, n._id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <button className="text-xs text-gray-500 hover:text-gray-800 hover:underline font-medium" onClick={() => setNotifOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <Avatar name={user?.fullName} size="sm" />
                <ChevronDown size={13} className={cn('text-gray-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-atlas z-50 animate-scale-in overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-[#001E2B] truncate">{user?.fullName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/dashboard/settings'); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Settings size={14} className="text-gray-400" /> Settings
                  </button>
                  <div className="border-t border-gray-100 mt-1" />
                  <button
                    onClick={async () => { setProfileOpen(false); await handleLogout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
