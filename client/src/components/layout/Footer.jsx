import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Mail } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#1a1a2e] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
                <span className="text-white text-sm font-black">R</span>
              </div>
              <span className="font-black text-white text-lg tracking-tight">RIVERS</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{t('footer.tagline')}</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <MapPin size={13} /> <span>Kigali, Rwanda</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Mail size={13} /> <span>hello@riversrwanda.rw</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">{t('footer.platform')}</h4>
            <ul className="flex flex-col gap-2">
              {['Campaigns', 'Donors', 'Community Leaders', 'Volunteers'].map((l) => (
                <li key={l}><Link to="/campaigns" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">{t('footer.company')}</h4>
            <ul className="flex flex-col gap-2">
              {['About RIVERS', 'RIVERS Initiative', 'Impact Reports', 'Contact'].map((l) => (
                <li key={l}><Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* SDG alignment */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">SDG Alignment</h4>
            <div className="flex flex-wrap gap-2">
              {['SDG 1', 'SDG 4', 'SDG 8', 'SDG 9', 'SDG 10', 'SDG 16', 'SDG 17'].map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-gray-300">{s}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">Aligned with Rwanda Vision 2050 and the Digital Rwanda Strategy.</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
