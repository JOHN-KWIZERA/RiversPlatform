import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import rivers40 from '../../images/rivers_40.jpg';
import rivers52 from '../../images/rivers_52.jpg';
import rivers71 from '../../images/rivers_71.jpg';
import rivers88 from '../../images/rivers_88.jpg';
import rivers91 from '../../images/rivers_91.jpg';
import rivers93 from '../../images/rivers_93.jpg';

// Provided by RIVERS — YouTube Short showcasing past campaign work.
// Shorts URL https://youtube.com/shorts/4AUfEsYONdg → privacy-enhanced embed.
const VIDEO_ID = '4AUfEsYONdg';
const VIDEO_EMBED = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`;
const VIDEO_THUMB = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;

// Real photos from past RIVERS campaigns (client/src/images).
const PHOTOS = [rivers88, rivers40, rivers52, rivers71, rivers91, rivers93];

// Per-tile grid spans — tiles perfectly at every breakpoint (feature photo first).
// mobile (2 cols): 2x2 feature, four squares, one full-width → 2×5 grid, no gaps.
// sm+ (3 cols):    2x2 feature + five squares → 3×3 grid, no gaps.
const SPANS = [
  'col-span-2 row-span-2', // feature
  '',
  '',
  '',
  '',
  'col-span-2 sm:col-span-1',
];

function AccentLine() {
  return <div className="w-10 h-0.5 bg-[#00ED64] mb-6" />;
}

export default function ImpactGallery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const photos = PHOTOS;

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <AccentLine />
            <h2 className="text-3xl sm:text-4xl font-black text-[#001E2B]">
              {t('gallery.title')}
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg text-base leading-relaxed">
              {t('gallery.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/campaigns')}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#001E2B] hover:text-[#00684A] transition-colors flex-shrink-0"
          >
            {t('gallery.view_campaigns')} <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          {/* Photo mosaic */}
          <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[128px] sm:auto-rows-[150px] lg:auto-rows-[172px] gap-3">
            {photos.slice(0, 6).map((src, i) => (
              <div
                key={`${src}-${i}`}
                className={`relative overflow-hidden rounded-2xl bg-gray-100 group ${SPANS[i] || ''}`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* YouTube short — vertical 9:16 */}
          <div className="relative rounded-2xl overflow-hidden bg-[#001E2B] min-h-[320px] lg:min-h-0">
            {playing ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`${VIDEO_EMBED}?autoplay=1&rel=0`}
                title="RIVERS campaign highlights"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 w-full h-full group"
                aria-label="Play campaign highlights video"
              >
                <img src={VIDEO_THUMB} alt="" className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B]/90 via-[#001E2B]/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#00ED64] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play size={26} className="text-[#001E2B] ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#00ED64] uppercase mb-2">
                    <Camera size={11} /> {t('gallery.video_tag')}
                  </span>
                  <p className="text-white font-black text-lg leading-snug">{t('gallery.video_title')}</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
