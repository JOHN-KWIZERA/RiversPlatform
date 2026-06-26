import { ShieldCheck, BarChart2, Users, Leaf, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const TEAM_VALUES = [
  { icon: ShieldCheck, title: 'Verified Impact',   desc: 'Every campaign is verified by trusted community leaders with documented evidence before going live.' },
  { icon: BarChart2,   title: 'Full Transparency', desc: 'Donors see exactly how funds are used, down to the individual beneficiary level, in real time.' },
  { icon: Users,       title: 'Community First',   desc: 'We work alongside communities, not for them. Local leaders define the needs; we provide the platform.' },
  { icon: Leaf,        title: 'SDG Aligned',       desc: 'Every programme maps to Rwanda Vision 2050 and the UN Sustainable Development Goals 1, 4, 8, 9, 10, 16, 17.' },
];

const STATS = [
  { value: '1,247+',    label: 'Families supported' },
  { value: '85+',       label: 'Verified campaigns' },
  { value: 'RWF 12.4M', label: 'Total raised' },
  { value: '340+',      label: 'Youth employed' },
];

const AccentLine = () => <div className="w-10 h-0.5 bg-[#00ED64] mb-6" />;

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 bg-[#001E2B]">
        <img
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-15"
        />
        <div className="absolute inset-0 bg-[#001E2B]/2" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 pt-20 pb-28">
          <div className="max-w-3xl">
            <AccentLine />
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Transparent giving.<br />Measurable impact.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
              RIVERS is a digital community impact platform built for Rwanda. We connect verified community leaders,
              sponsors, volunteers, and beneficiaries through a transparent, accountable system that documents every
              franc and every family helped.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-b border-gray-100 py-14">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:divide-x sm:divide-gray-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="sm:px-8 first:pl-0">
                <p className="text-4xl font-black text-[#001E2B]">{value}</p>
                <p className="text-sm text-gray-400 mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission split */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <AccentLine />
              <h2 className="text-4xl font-black text-[#001E2B] leading-snug mb-6">
                Built on trust,<br />transparency, and community.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                We believe accountability is the foundation of lasting change. Every feature in RIVERS is designed
                to eliminate doubt — for donors, for communities, and for the families who depend on every franc
                being used as promised.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Our verification process is human-first: community leaders provide documented evidence before any
                campaign goes live. Sponsors see real-time updates. Beneficiaries are registered, not assumed.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {TEAM_VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-5 p-6 rounded-2xl bg-[#f7f8fa] border border-gray-100">
                  <div className="w-11 h-11 rounded-xl bg-[#001E2B] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-[#00ED64]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#001E2B] mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rwanda alignment — dark section */}
      <section className="py-28 bg-[#001E2B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <AccentLine />
              <h2 className="text-4xl font-black text-white leading-snug mb-6">
                Aligned with<br />Rwanda's vision.
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                RIVERS is built in full alignment with the Rwanda Vision 2050, the Digital Rwanda Strategy, and
                the RISA compliance framework. Every feature is designed to meet Rwanda's data protection
                law (Law No. 058/2021) while maximising community benefit.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Rwanda Vision 2050', 'Digital Rwanda Strategy', 'SDGs 1, 4, 8, 9, 10, 16, 17', 'RISA Compliant', 'Law No. 058/2021'].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#00ED64] rounded-2xl p-8 flex flex-col gap-2">
                <p className="text-5xl font-black text-[#001E2B] leading-none">85+</p>
                <p className="text-[#001E2B]/70 text-sm font-medium leading-snug">Verified campaigns active</p>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-8 flex flex-col gap-2">
                <p className="text-5xl font-black text-white leading-none">340+</p>
                <p className="text-white/50 text-sm leading-snug">Youth employed through campaigns</p>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-8 col-span-2 flex flex-col gap-2">
                <p className="text-5xl font-black text-white leading-none">7 SDGs</p>
                <p className="text-white/50 text-sm leading-snug">Directly addressed through every campaign on the platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <AccentLine />
          <h2 className="text-4xl font-black text-[#001E2B] mb-5">Ready to make an impact?</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Join community leaders, sponsors, and volunteers building a more equitable Rwanda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-7 py-4 bg-[#00ED64] text-[#001E2B] font-bold text-sm rounded-full hover:bg-[#00c850] transition-colors"
            >
              Get started <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/campaigns')}
              className="inline-flex items-center gap-2 px-7 py-4 border border-gray-300 text-[#001E2B] font-semibold text-sm rounded-full hover:border-[#001E2B] transition-colors"
            >
              Browse campaigns
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
