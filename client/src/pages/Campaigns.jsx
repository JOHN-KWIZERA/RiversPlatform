import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CampaignCard from '../components/campaigns/CampaignCard';
import DonationModal from '../components/donations/DonationModal';
import Input from '../components/ui/Input';
import { MOCK_CAMPAIGNS, cn } from '../lib/utils';

const CATEGORIES = ['all', 'education', 'healthcare', 'food_security', 'emergency', 'housing', 'youth_employment'];

export default function Campaigns() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [donateTarget, setDonateTarget] = useState(null);

  const filtered = MOCK_CAMPAIGNS.filter((c) => {
    const matchCat = category === 'all' || c.category === category;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.community.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="text-center mb-10">
            <p className="section-label mb-2">All Campaigns</p>
            <h1 className="text-4xl font-black text-[#1a1a2e]">{t('campaigns.title')}</h1>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">{t('campaigns.subtitle')}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1">
              <Input placeholder={t('campaigns.search')} leftElement={<Search size={15} />} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${category === c ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200'}`}>
                  {c === 'all' ? t('campaigns.filter_all') : t(`categories.${c}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((c) => (
                <CampaignCard key={c._id} campaign={c} onDonate={c.status === 'active' ? setDonateTarget : undefined} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-[#1a1a2e]">{t('campaigns.no_results')}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <DonationModal open={!!donateTarget} onClose={() => setDonateTarget(null)} campaign={donateTarget} />
    </div>
  );
}
