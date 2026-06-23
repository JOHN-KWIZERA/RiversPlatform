import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, ShieldCheck, BarChart2, Leaf, ChevronRight,
  BookOpen, HeartPulse, Briefcase, Home, UtensilsCrossed, Users,
  MapPin, Zap, Quote, Calendar, Clock,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CampaignCard from '../components/campaigns/CampaignCard';
import DonationModal from '../components/donations/DonationModal';
import Button from '../components/ui/Button';
import { campaignApi, opportunityApi } from '../lib/api';
import { MOCK_CAMPAIGNS, formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const HOW_IT_WORKS = [
  { step: '01', title: 'Leaders Identify',    desc: 'Community leaders document vulnerable families with verified evidence and supporting data.',        icon: ShieldCheck },
  { step: '02', title: 'Campaigns Go Live',   desc: 'Our team reviews and approves each campaign, then publishes it with full financial transparency.',  icon: BarChart2 },
  { step: '03', title: 'Sponsors Contribute', desc: 'Donors browse verified campaigns and give through secure, tracked channels — every franc counted.',  icon: Users },
  { step: '04', title: 'Impact Is Measured',  desc: 'Every campaign closes with an evidence-based impact report visible to all stakeholders.',            icon: Leaf },
];

const ROLES = [
  { role: 'Community Leader', desc: 'Verify beneficiaries and launch transparent campaigns for your community.', icon: MapPin, color: 'bg-brand-500',  signup: 'community_leader' },
  { role: 'Sponsor / Donor',  desc: 'Browse verified campaigns and track exactly how your funds create impact.', icon: Zap,    color: 'bg-forest-500', signup: 'sponsor' },
  { role: 'Volunteer',        desc: 'Contribute your time and skills to community development projects.',         icon: Users,  color: 'bg-amber-500',  signup: 'volunteer' },
  { role: 'Beneficiary',      desc: 'Access support services and track aid received through your community.',    icon: Home,   color: 'bg-blue-500',   signup: 'beneficiary' },
];

const CATEGORIES = [
  { key: 'education',        label: 'Education',        icon: BookOpen,        color: 'bg-blue-50 text-blue-600' },
  { key: 'healthcare',       label: 'Healthcare',       icon: HeartPulse,      color: 'bg-emerald-50 text-emerald-600' },
  { key: 'youth_employment', label: 'Youth Employment', icon: Briefcase,       color: 'bg-forest-50 text-forest-600' },
  { key: 'food_security',    label: 'Food Security',    icon: UtensilsCrossed, color: 'bg-amber-50 text-amber-600' },
  { key: 'housing',          label: 'Housing',          icon: Home,            color: 'bg-purple-50 text-purple-600' },
];

const STATS = [
  { value: '1,247+', label: 'Families supported' },
  { value: '85+',    label: 'Verified campaigns' },
  { value: 'RWF 12.4M', label: 'Total raised' },
  { value: '340+',   label: 'Youth employed' },
];

const TESTIMONIALS = [
  {
    quote: "Before RIVERS, raising funds meant going door to door. Now our campaign reached sponsors across Kigali in three days.",
    name: "Marie Uwimana",
    role: "Community Leader · Gasabo",
    highlight: "RWF 2.3M raised",
    seed: 'marie',
  },
  {
    quote: "I can see exactly how every franc I donate is used. That level of transparency is rare — it's why I keep coming back.",
    name: "Amahoro Foundation",
    role: "Corporate Sponsor · Kigali",
    highlight: "12 campaigns funded",
    seed: 'amahoro',
  },
  {
    quote: "My children are in school because of a RIVERS campaign. I never thought we'd find support this quickly.",
    name: "Solange Iradukunda",
    role: "Beneficiary · Rwamagana",
    highlight: "School fees covered",
    seed: 'solange',
  },
];

const TICKER_ITEMS = [
  'Education fund · Gasabo · 65% funded',
  'Healthcare campaign · Nyarugenge · Goal reached',
  '42 families supported this week',
  'New campaign launched · Kicukiro',
  'RWF 850,000 raised in 24 hours',
  '8 new volunteers joined this week',
  'Youth Employment · Kigali · 87% funded',
  'Housing campaign · Rwamagana · Just approved',
];

const AVATAR_SEEDS = ['person1', 'person2', 'person3', 'person4', 'person5'];

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donateTarget, setDonateTarget] = useState(null);
  const [featured, setFeatured] = useState(MOCK_CAMPAIGNS.filter((c) => c.isFeatured).slice(0, 3));
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    campaignApi.getAll({ status: 'active', limit: 3 })
      .then(res => { if (res.campaigns?.length) setFeatured(res.campaigns); })
      .catch(() => {});
    opportunityApi.getAll({ status: 'open', limit: 6 })
      .then(res => setOpportunities(res.opportunities || []))
      .catch(() => {});
  }, []);

  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero — photo background ───────────────────────────── */}
      <section className="relative pt-32 pb-24 sm:pt-44 sm:pb-36 overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/kigali-community/1600/900"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001E2B]/80 via-[#001E2B]/70 to-[#001E2B]/95" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight text-balance">
            {t('hero.headline')}
          </h1>

          <p className="text-lg text-[#adb5bd] leading-relaxed max-w-xl mx-auto mt-6">
            {t('hero.sub')}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-9">
            <Button
              variant="primary"
              size="xl"
              rightIcon={<ArrowRight size={18} />}
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              {t('hero.cta_primary')}
            </Button>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all duration-150"
              onClick={() => navigate('/campaigns')}
            >
              {t('hero.cta_secondary')}
            </button>
          </div>

          {/* Social proof avatars */}
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {AVATAR_SEEDS.map((seed, i) => (
                  <img
                    key={seed}
                    src={`https://picsum.photos/seed/${seed}/40/40`}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-[#001E2B] object-cover"
                    style={{ marginLeft: i === 0 ? 0 : '-10px' }}
                  />
                ))}
                <div
                  className="w-9 h-9 rounded-full border-2 border-[#001E2B] bg-brand-500 flex items-center justify-center text-white text-[10px] font-black"
                  style={{ marginLeft: '-10px' }}
                >
                  1.2k
                </div>
              </div>
              <p className="text-white/60 text-xs">1,247 community members</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────── */}
      <div className="bg-[#f7f8fa] border-y border-gray-200 py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {tickerContent.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats — dark band ─────────────────────────────────── */}
      <section className="bg-[#001E2B] py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.07]">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-[#001E2B] px-8 py-8 text-center">
                <p className="text-4xl lg:text-5xl font-black text-white tracking-tight">{value}</p>
                <p className="text-[#889397] text-sm mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e] text-center mb-16">
            From community to impact — in four steps
          </h2>
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-0">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent pointer-events-none" />
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} className="relative flex flex-col items-center text-center px-6 py-2">
                <div className="relative mb-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${i % 2 === 0 ? 'bg-[#001E2B]' : 'bg-brand-500'}`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-100 shadow-sm text-[10px] font-black text-gray-400 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-[#1a1a2e] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Volunteer opportunities ───────────────────────────── */}
      {opportunities.length > 0 && (
        <section className="py-20 bg-[#f7f8fa] border-b border-gray-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e]">Give your time</h2>
                <p className="text-gray-500 mt-2 text-sm max-w-md">
                  Skills and presence matter just as much as money. Find where you fit.
                </p>
              </div>
              <Button variant="ghost" rightIcon={<ChevronRight size={16} />} onClick={() => navigate('/signup?role=volunteer')}>
                Browse all
              </Button>
            </div>

            {/* Horizontal scroll strip */}
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {opportunities.map((opp) => (
                <div
                  key={opp._id}
                  className="flex-shrink-0 w-72 snap-start bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-brand-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#001E2B] text-sm leading-snug truncate">{opp.title}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin size={11} /> {opp.community}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      opp.status === 'open' ? 'bg-forest-50 text-forest-700' : 'bg-gray-100 text-gray-500'
                    }`}>{opp.status}</span>
                  </div>

                  {opp.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {opp.skills.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{s}</span>
                      ))}
                      {opp.skills.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{opp.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {opp.startDate ? formatDate(opp.startDate) : 'Flexible'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {(opp.slots - (opp.filledSlots || 0))} slots left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Role paths ───────────────────────────────────────── */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e] text-center mb-10">
            Find your role in the movement
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map(({ role, desc, icon: Icon, color, signup }) => (
              <div
                key={role}
                className="group bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 cursor-pointer hover:border-brand-200 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200"
                onClick={() => navigate(`/signup?role=${signup}`)}
              >
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a2e]">{role}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all duration-150">
                  Get started <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 bg-[#f7f8fa] border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e] text-center mb-12">
            Real people. Real impact.
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, highlight, seed }, i) => (
              <div
                key={name}
                className={`rounded-2xl p-7 flex flex-col gap-5 ${i === 1 ? 'bg-[#001E2B] sm:mt-6' : 'bg-white border border-gray-100'}`}
              >
                <Quote size={24} className={i === 1 ? 'text-brand-400' : 'text-gray-200'} />
                <p className={`text-sm leading-relaxed flex-1 ${i === 1 ? 'text-[#ccd4d7]' : 'text-gray-600'}`}>
                  {quote}
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://picsum.photos/seed/${seed}/40/40`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <p className={`text-sm font-bold ${i === 1 ? 'text-white' : 'text-[#001E2B]'}`}>{name}</p>
                    <p className={`text-xs ${i === 1 ? 'text-[#889397]' : 'text-gray-400'}`}>{role}</p>
                  </div>
                  <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    i === 1 ? 'bg-brand-500/20 text-[#00ED64]' : 'bg-brand-50 text-brand-600'
                  }`}>
                    {highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by category ────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => navigate(`/campaigns?category=${key}`)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${color} text-sm font-semibold hover:scale-105 transition-transform`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-black text-[#1a1a2e]">Make a difference today</h2>
          <Button variant="ghost" rightIcon={<ChevronRight size={16} />} onClick={() => navigate('/campaigns')}>
            {t('common.view_all')}
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              onDonate={campaign.status === 'active' ? setDonateTarget : undefined}
            />
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#001E2B] to-[#023430] rounded-2xl p-12 sm:p-16 text-white text-center relative overflow-hidden border border-white/[0.07]">
            <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-forest-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 text-balance">
                Transparent giving. Measurable impact. Stronger communities.
              </h2>
              <p className="text-[#889397] max-w-xl mx-auto mb-8 leading-relaxed">
                Join over 1,200 families, 85 campaigns, and hundreds of sponsors building a more equitable Rwanda.
              </p>
              <Button
                variant="primary"
                size="xl"
                rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
              >
                {user ? 'Go to dashboard' : 'Start your journey'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <DonationModal
        open={!!donateTarget}
        onClose={() => setDonateTarget(null)}
        campaign={donateTarget}
      />
    </div>
  );
}
