import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SearchX, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CampaignCard from '../components/campaigns/CampaignCard';
import DonationModal from '../components/donations/DonationModal';
import Spinner from '../components/ui/Spinner';
import { campaignApi } from '../lib/api';
import { MOCK_CAMPAIGNS, cn } from '../lib/utils';

const CATEGORIES = ['all', 'education', 'healthcare', 'food_security', 'emergency', 'housing', 'youth_employment'];

export default function Campaigns() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donateTarget, setDonateTarget] = useState(null);

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    const params = { status: 'active', limit: 24 };
    if (category !== 'all') params.category = category;
    if (search.trim()) params.search = search.trim();
    campaignApi.getAll(params)
      .then(res => setCampaigns(res.campaigns?.length ? res.campaigns : MOCK_CAMPAIGNS))
      .catch(() => setCampaigns(MOCK_CAMPAIGNS))
      .finally(() => setLoading(false));
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCampaigns, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchCampaigns]);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <img
          src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-[#001E2B]/85" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-20">
          <div className="w-10 h-0.5 bg-[#00ED64] mb-6" />
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
            Active campaigns.
          </h1>
          <p className="text-white/50 text-lg max-w-lg leading-relaxed mb-10">
            Every campaign on RIVERS is verified by a trusted community leader. Browse, support, and track real impact.
          </p>

          {/* Search */}
          <div className="max-w-xl relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder={t('campaigns.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ED64]/40 focus:border-[#00ED64]/40 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 pb-20">

        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-1.5 mr-2 text-gray-400 flex-shrink-0">
            <SlidersHorizontal size={13} />
            <span className="text-xs font-semibold">Filter</span>
          </div>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap flex-shrink-0',
                category === c
                  ? 'bg-[#001E2B] text-white border-[#001E2B]'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#001E2B]/30 hover:text-[#001E2B]'
              )}
            >
              {c === 'all' ? t('campaigns.filter_all') : t(`categories.${c}`)}
            </button>
          ))}
        </div>

        {!loading && campaigns.length > 0 && (
          <p className="text-xs text-gray-400 mb-6 font-medium">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            {category !== 'all' ? ` in ${t(`categories.${category}`)}` : ''}
            {search ? ` matching "${search}"` : ''}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <Spinner size={32} className="text-[#00684A]" />
            <p className="text-sm text-gray-400">Finding campaigns…</p>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((c) => (
              <CampaignCard key={c._id} campaign={c} onDonate={c.status === 'active' ? setDonateTarget : undefined} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-28 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <SearchX size={28} className="text-gray-300" />
            </div>
            <div>
              <p className="font-bold text-[#001E2B]">{t('campaigns.no_results')}</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search or category.</p>
            </div>
            {(search || category !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCategory('all'); }}
                className="text-xs text-[#00684A] font-semibold hover:text-[#00684A]/70 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <Footer />
      <DonationModal open={!!donateTarget} onClose={() => setDonateTarget(null)} campaign={donateTarget} />
    </div>
  );
}
