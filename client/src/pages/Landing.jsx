import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, ShieldCheck, BarChart2, Users, Leaf,
  CheckCircle2, MapPin, Zap, ChevronRight,
  BookOpen, HeartPulse, Briefcase, Home, UtensilsCrossed,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CampaignCard from '../components/campaigns/CampaignCard';
import DonationModal from '../components/donations/DonationModal';
import Button from '../components/ui/Button';
import { MOCK_CAMPAIGNS, formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { value: '1,247', key: 'stat_families', color: 'text-brand-600' },
  { value: '85', key: 'stat_campaigns', color: 'text-forest-600' },
  { value: 'RWF 12.4M', key: 'stat_raised', color: 'text-brand-600' },
  { value: '340', key: 'stat_youth', color: 'text-forest-600' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Leaders Verify', desc: 'Trusted community leaders identify and document vulnerable families with photo evidence.', icon: ShieldCheck, color: 'text-brand-500', bg: 'bg-brand-50' },
  { step: '02', title: 'Campaigns Go Live', desc: 'Verified campaigns are reviewed by our team and published transparently for sponsors.', icon: BarChart2, color: 'text-forest-500', bg: 'bg-forest-50' },
  { step: '03', title: 'Sponsors Support', desc: 'Donors browse verified campaigns and contribute through secure, tracked payments.', icon: Users, color: 'text-brand-500', bg: 'bg-brand-50' },
  { step: '04', title: 'Impact Measured', desc: 'Every campaign generates an evidence-based impact report visible to all stakeholders.', icon: Leaf, color: 'text-forest-500', bg: 'bg-forest-50' },
];

const ROLES = [
  { role: 'Community Leader', desc: 'Verify beneficiaries and create transparent campaigns for your community.', icon: MapPin, color: 'bg-brand-500', signup: 'community_leader' },
  { role: 'Sponsor / Donor', desc: 'Browse verified campaigns and track exactly how your funds create impact.', icon: Zap, color: 'bg-forest-500', signup: 'sponsor' },
  { role: 'Volunteer', desc: 'Contribute your time and skills to community development projects.', icon: Users, color: 'bg-amber-warm', signup: 'volunteer' },
  { role: 'Beneficiary', desc: 'Access support services and track aid received through your community.', icon: Home, color: 'bg-blue-500', signup: 'beneficiary' },
];

const CATEGORIES = [
  { key: 'education', label: 'Education', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
  { key: 'healthcare', label: 'Healthcare', icon: HeartPulse, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'youth_employment', label: 'Youth Employment', icon: Briefcase, color: 'bg-forest-50 text-forest-600' },
  { key: 'food_security', label: 'Food Security', icon: UtensilsCrossed, color: 'bg-amber-50 text-amber-600' },
  { key: 'housing', label: 'Housing', icon: Home, color: 'bg-purple-50 text-purple-600' },
];

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donateTarget, setDonateTarget] = useState(null);

  const featured = MOCK_CAMPAIGNS.filter((c) => c.isFeatured).slice(0, 3);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="gradient-hero pt-28 pb-16 sm:pt-36 sm:pb-24 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-0 w-72 h-72 bg-brand-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-56 h-56 bg-forest-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center relative">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
              <CheckCircle2 size={12} /> {t('hero.badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1a1a2e] leading-[1.1] tracking-tight text-balance">
              {t('hero.headline')}
            </h1>
            <p className="text-base text-gray-600 leading-relaxed max-w-lg">
              {t('hero.sub')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="xl"
                rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
              >
                {t('hero.cta_primary')}
              </Button>
              <Button
                variant="secondary"
                size="xl"
                onClick={() => navigate('/campaigns')}
              >
                {t('hero.cta_secondary')}
              </Button>
            </div>

            {/* Trust marks */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <ShieldCheck size={14} className="text-forest-500" />
                <span>Verified campaigns</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <BarChart2 size={14} className="text-brand-500" />
                <span>Full transparency</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Leaf size={14} className="text-forest-500" />
                <span>SDG aligned</span>
              </div>
            </div>
          </div>

          {/* Right – floating campaign cards */}
          <div className="relative hidden lg:grid grid-cols-2 gap-3">
            {featured.slice(0, 2).map((c, i) => (
              <div
                key={c._id}
                className={`card overflow-hidden ${i === 1 ? 'mt-8' : ''}`}
                style={{ transform: i === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }}
              >
                <img src={c.coverImage} alt={c.title} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="text-xs font-semibold text-[#1a1a2e] line-clamp-2">{c.title}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-brand-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${c.progressPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span className="font-semibold text-brand-600">{c.progressPercent}%</span>
                    <span>{c.donorCount} donors</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Floating badge */}
            <div className="absolute -bottom-4 left-4 bg-forest-500 text-white rounded-2xl px-4 py-2.5 shadow-lg">
              <p className="text-xs font-bold">🎉 RWF 980K raised today</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-gray-100">
            {STATS.map(({ value, key, color }) => (
              <div key={key} className="text-center sm:px-8 first:pl-0 last:pr-0">
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="text-sm text-gray-500 mt-1">{t(`hero.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
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
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="section-label mb-2">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e]">Four steps to real impact</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, color, bg }) => (
              <div key={step} className="card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon size={24} className={color} />
                  </div>
                  <span className="text-3xl font-black text-gray-100">{step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a2e]">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label mb-2">{t('campaigns.title')}</p>
            <h2 className="text-3xl font-black text-[#1a1a2e]">Make a difference today</h2>
          </div>
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

      {/* ── Join section ──────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="section-label mb-2">Join Our Community</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e]">Everyone has a role to play</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Whether you're a community leader, sponsor, volunteer, or beneficiary — RIVERS has a place for you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map(({ role, desc, icon: Icon, color, signup }) => (
              <div
                key={role}
                className="card-hover p-6 flex flex-col gap-4 text-center items-center"
                onClick={() => navigate(`/signup?role=${signup}`)}
              >
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
                  <Icon size={26} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a2e]">{role}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                  Get started <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d3561] rounded-4xl p-10 sm:p-14 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-block bg-brand-500/20 text-brand-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                Aligned with Rwanda Vision 2050
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 text-balance">
                Transparent giving. Measurable impact. Stronger communities.
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
                Join over 1,200 families, 85 campaigns, and hundreds of sponsors building a more equitable Rwanda.
              </p>
              <Button
                variant="primary"
                size="xl"
                rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate('/signup')}
              >
                Start your journey
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
