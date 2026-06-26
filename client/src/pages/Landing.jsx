import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, ShieldCheck, BarChart2, Leaf, ChevronRight,
  Home, Users, MapPin, Heart, Calendar,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import DonationModal from '../components/donations/DonationModal';
import { campaignApi, opportunityApi } from '../lib/api';
import { MOCK_CAMPAIGNS, formatDate, formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const HOW_IT_WORKS = [
  { step: '01', title: 'Leaders Identify',    desc: 'Community leaders document vulnerable families with verified evidence and supporting data.',       icon: ShieldCheck },
  { step: '02', title: 'Campaigns Go Live',   desc: 'Our team reviews and approves each campaign, then publishes it with full financial transparency.', icon: BarChart2 },
  { step: '03', title: 'Sponsors Contribute', desc: 'Donors browse verified campaigns and give through secure, tracked channels — every franc counted.', icon: Heart },
  { step: '04', title: 'Impact Is Measured',  desc: 'Every campaign closes with an evidence-based impact report visible to all stakeholders.',           icon: Leaf },
];

const ROLES = [
  { role: 'Community Leader', desc: 'Verify beneficiaries and launch transparent campaigns for your community.', icon: MapPin, signup: 'community_leader' },
  { role: 'Sponsor / Donor',  desc: 'Browse verified campaigns and track exactly how your funds create impact.', icon: Heart,  signup: 'sponsor' },
  { role: 'Volunteer',        desc: 'Contribute your time and skills to community development projects.',         icon: Users,  signup: 'volunteer' },
  { role: 'Beneficiary',      desc: 'Access support services and track aid received through your community.',    icon: Home,   signup: 'beneficiary' },
];

const TESTIMONIALS = [
  {
    quote: "Before RIVERS, raising funds meant going door to door. Now our campaign reached sponsors across Kigali in three days.",
    name: "Marie Uwimana",
    role: "Community Leader · Gasabo",
    highlight: "RWF 2.3M raised",
  },
  {
    quote: "I can see exactly how every franc I donate is used. That level of transparency is rare — it's why I keep coming back.",
    name: "Amahoro Foundation",
    role: "Corporate Sponsor · Kigali",
    highlight: "12 campaigns funded",
  },
  {
    quote: "My children are in school because of a RIVERS campaign. I never thought we'd find support this quickly.",
    name: "Solange Iradukunda",
    role: "Beneficiary · Rwamagana",
    highlight: "School fees covered",
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

const CATEGORY_COLORS = {
  education:        'from-blue-900',
  healthcare:       'from-emerald-900',
  youth_employment: 'from-amber-900',
  food_security:    'from-orange-900',
  housing:          'from-purple-900',
  emergency:        'from-red-900',
};

function AccentLine() {
  return <div className="w-10 h-0.5 bg-[#00ED64] mb-6" />;
}

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donateTarget, setDonateTarget] = useState(null);
  const [featured, setFeatured] = useState(MOCK_CAMPAIGNS.filter(c => c.isFeatured).slice(0, 4));
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    campaignApi.getAll({ status: 'active', limit: 4 })
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

      {/* ── Hero — full-bleed cinematic ───────────────────────── */}
      <section className="relative h-[92vh] min-h-[620px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#001E2B]/55 via-[#001E2B]/45 to-[#001E2B]/90" />

        {/* Bottom-anchored headline — Mastercard style */}
        <div className="absolute bottom-0 left-0 right-0 pb-16 px-6 sm:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
            <div className="max-w-3xl">
              <AccentLine />
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
                Creating impact,<br />together in Rwanda.
              </h1>
              <p className="text-white/65 text-lg mt-5 max-w-xl leading-relaxed">
                Every community. Every family. Every franc — transparent, verified, and accountable.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                className="inline-flex items-center gap-2 px-6 py-4 bg-[#00ED64] text-[#001E2B] text-sm font-black rounded-lg hover:bg-[#00c952] transition-colors"
              >
                Get involved <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/campaigns')}
                className="inline-flex items-center gap-2 px-6 py-4 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                → Explore campaigns
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────── */}
      <div className="bg-[#001E2B] border-b border-white/[0.06] py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {tickerContent.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-8 text-xs text-white/40 font-medium tracking-wide">
              <span className="w-1 h-1 rounded-full bg-[#00ED64] flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Mission statement ────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <AccentLine />
            <h2 className="text-4xl sm:text-5xl font-black text-[#001E2B] leading-[1.1]">
              We believe every community deserves transparent, accountable support.
            </h2>
          </div>
          <div className="lg:pt-14">
            <p className="text-gray-500 text-lg leading-relaxed mb-10">
              RIVERS connects community leaders, sponsors, and volunteers through a platform built on radical transparency. Every franc raised is tracked. Every family helped is verified. Every report is public.
            </p>
            <div className="grid grid-cols-2 gap-y-8 gap-x-6 mb-10">
              {[
                { value: '1,247+',    label: 'Families supported' },
                { value: '85+',       label: 'Verified campaigns' },
                { value: 'RWF 12.4M', label: 'Total raised' },
                { value: '340+',      label: 'Youth employed' },
              ].map(({ value, label }) => (
                <div key={label} className="border-l-2 border-[#00ED64] pl-5">
                  <p className="text-3xl font-black text-[#001E2B]">{value}</p>
                  <p className="text-sm text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/about')}
              className="inline-flex items-center gap-2 px-5 py-3 border border-[#001E2B] text-[#001E2B] text-sm font-semibold rounded-lg hover:bg-[#001E2B] hover:text-white transition-colors"
            >
              → Learn more about RIVERS
            </button>
          </div>
        </div>
      </section>

      {/* ── Stories from the field ────────────────────────────── */}
      <section className="py-20 bg-[#f7f8fa] border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-10">
          <div className="flex items-end justify-between">
            <div>
              <AccentLine />
              <h2 className="text-3xl sm:text-4xl font-black text-[#001E2B]">Stories from the field</h2>
              <p className="text-gray-500 mt-2 text-base">Real campaigns. Real communities. Real change.</p>
            </div>
            <button
              onClick={() => navigate('/campaigns')}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#001E2B] hover:text-[#00684A] transition-colors"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 pl-6 sm:pl-10 scrollbar-hide snap-x snap-mandatory">
          {featured.map((campaign, i) => (
            <div
              key={campaign._id}
              onClick={() => navigate(user ? `/dashboard/campaigns/${campaign._id}` : '/campaigns')}
              className="relative flex-shrink-0 w-80 sm:w-[26rem] h-[480px] rounded-2xl overflow-hidden cursor-pointer group snap-start"
            >
              <img
                src={campaign.coverUrl || campaign.coverImage || `https://picsum.photos/seed/${campaign._id || `camp-${i}`}/400/600`}
                alt={campaign.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${CATEGORY_COLORS[campaign.category] || 'from-[#001E2B]'} via-transparent to-transparent opacity-90`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {campaign.category && (
                  <span className="text-[10px] font-bold tracking-widest text-[#00ED64] uppercase block mb-2">
                    {campaign.category.replace(/_/g, ' ')}
                  </span>
                )}
                <h3 className="text-white font-black text-lg leading-snug">{campaign.title}</h3>
                {campaign.district && (
                  <p className="flex items-center gap-1 text-white/50 text-xs mt-2">
                    <MapPin size={10} /> {campaign.district}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{formatCurrency(campaign.raisedAmount || 0)}</p>
                    <p className="text-white/40 text-xs">of {formatCurrency(campaign.targetAmount || 0)} goal</p>
                  </div>
                  <span className="flex items-center gap-1 text-[#00ED64] text-xs font-bold">
                    Support <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* See-all card */}
          <div
            onClick={() => navigate('/campaigns')}
            className="flex-shrink-0 w-64 h-[480px] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#00684A] transition-colors snap-start mr-6 sm:mr-10"
          >
            <div className="w-14 h-14 rounded-full bg-[#001E2B] flex items-center justify-center">
              <ArrowRight size={20} className="text-[#00ED64]" />
            </div>
            <p className="text-sm font-bold text-[#001E2B] text-center px-8">See all active campaigns</p>
          </div>
        </div>
      </section>

      {/* ── Impact mosaic — Mastercard style ─────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <AccentLine />
              <h2 className="text-3xl sm:text-4xl font-black text-[#001E2B]">Tracking towards our commitment</h2>
            </div>
            <p className="text-gray-400 text-sm max-w-xs sm:text-right leading-relaxed">
              Numbers that represent real families, real accountability, and real change across Rwanda.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#001E2B] rounded-2xl p-12 flex flex-col justify-between min-h-[320px]">
              <div className="w-10 h-0.5 bg-[#00ED64]" />
              <div>
                <p className="text-7xl sm:text-8xl font-black text-white leading-none">1,247</p>
                <p className="text-xl font-bold text-white/60 mt-3">Families supported</p>
                <p className="text-white/35 text-sm mt-4 leading-relaxed max-w-sm">
                  Across every district in Rwanda — real households receiving verified support, documented from first franc to final outcome.
                </p>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-[#00ED64] uppercase mt-8">Human impact</p>
            </div>
            <div className="bg-[#00684A] rounded-2xl p-12 flex flex-col justify-between min-h-[320px]">
              <div className="w-10 h-0.5 bg-[#00ED64]" />
              <div>
                <p className="text-6xl sm:text-7xl font-black text-white leading-none">RWF<br />12.4M</p>
                <p className="text-xl font-bold text-white/60 mt-3">Raised with full transparency</p>
                <p className="text-white/35 text-sm mt-4 leading-relaxed max-w-sm">
                  Every franc tracked in real time — from the moment a donor gives to the moment a community receives. No gaps. No guesswork.
                </p>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-[#00ED64] uppercase mt-8">Financial accountability</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works — dark section ──────────────────────── */}
      <section className="py-28 bg-[#001E2B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="mb-16">
            <AccentLine />
            <h2 className="text-3xl sm:text-4xl font-black text-white">How RIVERS works</h2>
            <p className="text-[#889397] mt-3 max-w-lg text-base leading-relaxed">
              A rigorous, community-driven process that turns real need into verifiable impact.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-8 flex flex-col gap-6 hover:bg-white/[0.07] transition-colors"
              >
                <Icon size={28} className="text-[#00ED64]" />
                <div>
                  <p className="text-xs text-[#889397] font-bold tracking-widest mb-3">{step}</p>
                  <h3 className="font-black text-white text-lg mb-3 leading-snug">{title}</h3>
                  <p className="text-[#889397] text-sm leading-relaxed">{desc}</p>
                </div>
                <div className="mt-auto pt-5 border-t border-white/[0.07]">
                  <span className="text-[#00ED64] text-xs font-semibold">→ Learn more</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Volunteer opportunities ───────────────────────────── */}
      {opportunities.length > 0 && (
        <section className="relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-[#001E2B]/80" />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-28">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: messaging + stats + CTA */}
              <div>
                <AccentLine />
                <h2 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6">
                  Your community<br className="hidden sm:block" /> is calling.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-10">
                  Behind every campaign is a community that needs more than money — it needs people.
                  Show up, share a skill, and make it real.
                </p>

                <div className="flex flex-wrap gap-10 mb-12">
                  <div>
                    <p className="text-5xl font-black text-white">{opportunities.length}</p>
                    <p className="text-sm text-white/40 mt-1">Open roles</p>
                  </div>
                  <div className="border-l border-white/10 pl-10">
                    <p className="text-5xl font-black text-[#00ED64]">
                      {opportunities.reduce((a, o) => a + Math.max(0, (o.slots || 0) - (o.filledSlots || 0)), 0)}
                    </p>
                    <p className="text-sm text-white/40 mt-1">Slots available</p>
                  </div>
                  <div className="border-l border-white/10 pl-10">
                    <p className="text-5xl font-black text-white">
                      {new Set(opportunities.map(o => o.community).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-white/40 mt-1">Communities</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/signup?role=volunteer')}
                  className="inline-flex items-center gap-2.5 px-7 py-4 bg-[#00ED64] text-[#001E2B] font-bold text-sm rounded-full hover:bg-[#00c850] transition-colors"
                >
                  Volunteer with us <ArrowRight size={15} />
                </button>
              </div>

              {/* Right: opportunity cards */}
              <div className="flex flex-col gap-4">
                {opportunities[0] && (
                  <div
                    onClick={() => navigate('/signup?role=volunteer')}
                    className="group bg-white/[0.06] border border-white/10 rounded-2xl p-7 hover:bg-white/[0.10] hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-[10px] font-bold tracking-widest text-[#00ED64] uppercase">Featured role</span>
                        <h3 className="text-lg font-black text-white mt-1 leading-snug">{opportunities[0].title}</h3>
                      </div>
                      <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ED64]/10 text-[#00ED64] text-[10px] font-bold border border-[#00ED64]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00ED64] animate-pulse" /> Open
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
                      <MapPin size={11} />{opportunities[0].community}
                    </p>
                    {opportunities[0].skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {opportunities[0].skills.slice(0, 4).map(s => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={11} />{opportunities[0].startDate ? formatDate(opportunities[0].startDate) : 'Flexible'}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-[#00ED64] group-hover:gap-2.5 transition-all">
                        <Users size={11} />{Math.max(0, (opportunities[0].slots || 0) - (opportunities[0].filledSlots || 0))} spots · Apply <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                )}

                {opportunities.slice(1, 3).map(opp => (
                  <div
                    key={opp._id}
                    onClick={() => navigate('/signup?role=volunteer')}
                    className="group bg-white/[0.06] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.10] hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{opp.title}</h3>
                        <p className="flex items-center gap-1 text-xs text-white/40 mt-1"><MapPin size={10} />{opp.community}</p>
                      </div>
                      <span className="flex-shrink-0 flex items-center gap-1 font-semibold text-[#00ED64] text-xs group-hover:gap-1.5 transition-all whitespace-nowrap">
                        {Math.max(0, (opp.slots || 0) - (opp.filledSlots || 0))} spots <ArrowRight size={11} />
                      </span>
                    </div>
                    {opp.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {opp.skills.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px]">{s}</span>
                        ))}
                        {opp.skills.length > 3 && <span className="text-[10px] text-white/30 self-center">+{opp.skills.length - 3}</span>}
                      </div>
                    )}
                  </div>
                ))}

                {opportunities.length > 3 && (
                  <button
                    onClick={() => navigate('/signup?role=volunteer')}
                    className="text-center text-xs text-white/40 hover:text-white/70 font-semibold transition-colors py-1"
                  >
                    + {opportunities.length - 3} more roles available
                  </button>
                )}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-28 bg-[#f7f8fa] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="mb-14">
            <AccentLine />
            <h2 className="text-3xl sm:text-4xl font-black text-[#001E2B]">Real people. Real impact.</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, highlight }, i) => (
              <div
                key={name}
                className={`rounded-2xl p-9 flex flex-col gap-7 ${i === 1 ? 'bg-[#001E2B]' : 'bg-white border border-gray-100'}`}
              >
                <div className={`w-8 h-0.5 ${i === 1 ? 'bg-[#00ED64]' : 'bg-[#00684A]'}`} />
                <p className={`text-base leading-relaxed flex-1 ${i === 1 ? 'text-[#ccd4d7]' : 'text-gray-600'}`}>
                  "{quote}"
                </p>
                <div>
                  <p className={`font-bold text-base ${i === 1 ? 'text-white' : 'text-[#001E2B]'}`}>{name}</p>
                  <p className={`text-sm mt-1 ${i === 1 ? 'text-[#889397]' : 'text-gray-400'}`}>{role}</p>
                  <span className={`inline-block mt-4 text-xs font-bold px-3 py-1.5 rounded-full ${i === 1 ? 'bg-[#00ED64]/10 text-[#00ED64]' : 'bg-[#00684A]/10 text-[#00684A]'}`}>
                    {highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Find your role ────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="max-w-xl mb-14">
            <AccentLine />
            <h2 className="text-3xl sm:text-4xl font-black text-[#001E2B]">Find your role in the movement</h2>
            <p className="text-gray-500 mt-3 text-base leading-relaxed">
              Every type of contribution matters. Choose how you want to show up.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map(({ role, desc, icon: Icon, signup }) => (
              <div
                key={role}
                onClick={() => navigate(`/signup?role=${signup}`)}
                className="group border border-gray-200 rounded-2xl p-8 flex flex-col gap-6 cursor-pointer hover:border-[#00684A] hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#001E2B] flex items-center justify-center">
                  <Icon size={20} className="text-[#00ED64]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[#001E2B] text-base">{role}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{desc}</p>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#001E2B] group-hover:text-[#00684A] group-hover:gap-2.5 transition-all">
                  Get started <ArrowRight size={14} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — full-bleed ────────────────────────────── */}
      <section className="relative py-36 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#001E2B]/92" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 text-center">
          <AccentLine />
          <div className="flex justify-center mb-8">
            <div className="w-10 h-0.5 bg-[#00ED64]" />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white max-w-3xl mx-auto leading-[1.1] mb-6">
            Transparent giving.<br />Measurable impact.
          </h2>
          <p className="text-white/75 max-w-lg mx-auto mb-12 text-lg leading-relaxed">
            Join over 1,200 families, 85 campaigns, and hundreds of sponsors building a more equitable Rwanda.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#00ED64] text-[#001E2B] font-black text-sm rounded-lg hover:bg-[#00c952] transition-colors"
            >
              {user ? 'Go to dashboard' : 'Start your journey'} <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/about')}
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-semibold text-sm rounded-lg hover:bg-white/10 transition-colors"
            >
              → Learn about our mission
            </button>
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
