import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe2, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'rw' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('rivers_lang', next);
  };

  return (
    <header className={cn(
      'fixed top-0 inset-x-0 z-40 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-warm group-hover:bg-brand-600 transition-colors">
            <span className="text-white text-sm font-black">R</span>
          </div>
          <span className="font-black text-[#1a1a2e] text-lg tracking-tight">RIVERS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/campaigns" className="btn-ghost text-sm">{t('nav.campaigns')}</Link>
          <Link to="/about" className="btn-ghost text-sm">{t('nav.about')}</Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Globe2 size={14} />
            {i18n.language === 'en' ? 'EN' : 'RW'}
          </button>
          {user ? (
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              {t('nav.dashboard')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
              <Button variant="primary" onClick={() => navigate('/signup')}>{t('nav.signup')}</Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-2 animate-slide-up">
          <Link to="/campaigns" className="py-2 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>{t('nav.campaigns')}</Link>
          <Link to="/about" className="py-2 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>{t('nav.about')}</Link>
          <hr className="border-gray-100" />
          {user ? (
            <Button variant="primary" onClick={() => { navigate('/dashboard'); setMobileOpen(false); }} className="w-full">
              {t('nav.dashboard')}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => { navigate('/login'); setMobileOpen(false); }} className="w-full">{t('nav.login')}</Button>
              <Button variant="primary" onClick={() => { navigate('/signup'); setMobileOpen(false); }} className="w-full">{t('nav.signup')}</Button>
            </div>
          )}
          <button onClick={toggleLang} className="flex items-center gap-2 py-2 text-sm text-gray-500">
            <Globe2 size={14} /> Switch to {i18n.language === 'en' ? 'Kinyarwanda' : 'English'}
          </button>
        </div>
      )}
    </header>
  );
}
