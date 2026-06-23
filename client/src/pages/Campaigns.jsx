import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SearchX } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CampaignCard from '../components/campaigns/CampaignCard';
import DonationModal from '../components/donations/DonationModal';
import Input from '../components/ui/Input';
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
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="text-center mb-10">
            <p className="section-label mb-2">All Campaigns</p>
            <h1 className="text-4xl font-black text-[#001E2B]">{t('campaigns.title')}</h1>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">{t('campaigns.subtitle')}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1">
              <Input
                placeholder={t('campaigns.search')}
                leftElement={<Search size={15} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'px-3 py-2 rounded-md text-xs font-semibold border transition-all',
                    category === c
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
                  )}
                >
                  {c === 'all' ? t('campaigns.filter_all') : t(`categories.${c}`)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size={32} className="text-brand-500" />
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((c) => (
                <CampaignCard key={c._id} campaign={c} onDonate={c.status === 'active' ? setDonateTarget : undefined} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <SearchX size={40} className="text-gray-200" />
              <p className="font-semibold text-[#001E2B]">{t('campaigns.no_results')}</p>
              <p className="text-sm text-gray-400">Try a different search or category.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <DonationModal open={!!donateTarget} onClose={() => setDonateTarget(null)} campaign={donateTarget} />
    </div>
  );
}
