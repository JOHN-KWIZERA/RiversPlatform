import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe2, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import RiversMark from '../ui/RiversMark';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const DARK_HERO_ROUTES = ['/', '/about'];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasDarkHero = DARK_HERO_ROUTES.includes(location.pathname);
  const isLight = scrolled || !hasDarkHero;

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
      isLight ? 'bg-white/98 backdrop-blur-md shadow-sm border-b border-gray-200' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <RiversMark size={36} />
          <span className={cn('font-black text-lg tracking-tight transition-colors', isLight ? 'text-[#001E2B]' : 'text-white')}>RIVERS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/campaigns" className={cn('px-3 py-2 rounded-md text-sm font-medium transition-colors', isLight ? 'text-gray-700 hover:text-brand-600' : 'text-white/80 hover:text-white')}>{t('nav.campaigns')}</Link>
          <Link to="/about" className={cn('px-3 py-2 rounded-md text-sm font-medium transition-colors', isLight ? 'text-gray-700 hover:text-brand-600' : 'text-white/80 hover:text-white')}>{t('nav.about')}</Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleLang}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors', isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10')}
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
              <Button
                variant="ghost"
                className={cn(!isLight && 'text-white/90 hover:bg-white/10 hover:text-white')}
                onClick={() => navigate('/login')}
              >
                {t('nav.login')}
              </Button>
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
