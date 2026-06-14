import { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, Globe2, CheckCircle2, Megaphone, Heart } from 'lucide-react';
import Sidebar from './Sidebar';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: Megaphone, color: 'text-brand-500 bg-brand-50', title: 'Campaign approved', body: 'Your campaign has been approved and is now live.', time: '2h ago', unread: true },
  { id: 2, icon: Heart,     color: 'text-forest-600 bg-forest-50', title: 'New donation received', body: 'RWF 50,000 donated to School Supplies campaign.', time: '5h ago', unread: true },
  { id: 3, icon: CheckCircle2, color: 'text-amber-600 bg-amber-50', title: 'Impact report ready', body: 'Q1 2026 impact report is now available.', time: '1d ago', unread: false },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const notifRef = useRef(null);
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const unreadCount = notifications.filter(n => n.unread).length;

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'rw' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('rivers_lang', next);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
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
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-atlas z-50 animate-scale-in overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-[#001E2B]">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      return (
                        <div key={n.id} className={cn('flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer', n.unread && 'bg-brand-50/40')}>
                          <div className={cn('w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5', n.color)}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#001E2B]">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                          </div>
                          {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-2" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <button className="text-xs text-brand-600 hover:underline font-medium">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            <Avatar name={user?.fullName} size="sm" className="cursor-pointer" />
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
