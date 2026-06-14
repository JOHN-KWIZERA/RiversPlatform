import { ShieldCheck, BarChart2, Users, Leaf, ArrowRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';

const TEAM_VALUES = [
  { icon: ShieldCheck, title: 'Verified Impact',   desc: 'Every campaign is verified by trusted community leaders with documented evidence before going live.' },
  { icon: BarChart2,   title: 'Full Transparency', desc: 'Donors see exactly how funds are used, down to the individual beneficiary level, in real time.' },
  { icon: Users,       title: 'Community First',   desc: 'We work alongside communities, not for them. Local leaders define the needs; we provide the platform.' },
  { icon: Leaf,        title: 'SDG Aligned',       desc: 'Every programme maps to Rwanda Vision 2050 and the UN Sustainable Development Goals 1, 4, 8, 9, 10, 16, 17.' },
];

const STATS = [
  { value: '1,247+', label: 'Families supported' },
  { value: '85+',    label: 'Verified campaigns' },
  { value: 'RWF 12.4M', label: 'Total raised' },
  { value: '340+',   label: 'Youth employed' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-brand-500/20 text-[#00ED64] text-xs font-bold border border-brand-400/30 mb-6">
            <Globe size={12} /> Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Transparent giving.<br />Measurable impact.
          </h1>
          <p className="text-[#889397] text-lg leading-relaxed max-w-2xl mx-auto">
            RIVERS is a digital community impact platform built for Rwanda. We connect verified community leaders,
            sponsors, volunteers, and beneficiaries through a transparent, accountable system that documents every
            franc and every family helped.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:divide-x sm:divide-gray-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center sm:px-8">
                <p className="text-3xl font-black text-brand-500">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-2">What we stand for</p>
          <h2 className="text-3xl font-black text-[#001E2B]">Built on trust, transparency, and community</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {TEAM_VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 flex gap-4 hover:-translate-y-0.5 transition-transform duration-200">
              <div className="w-11 h-11 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#001E2B]">{title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rwanda alignment */}
      <section className="py-20 bg-[#f7f8fa] border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="section-label mb-2">Our Context</p>
          <h2 className="text-3xl font-black text-[#001E2B] mb-5">Aligned with Rwanda's vision</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            RIVERS is built in full alignment with the Rwanda Vision 2050, the Digital Rwanda Strategy, and
            the RISA compliance framework. Every feature and process is designed to meet Rwanda's data protection
            law (Law No. 058/2021) while maximising community benefit.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Rwanda Vision 2050', 'Digital Rwanda Strategy', 'SDGs 1, 4, 8, 9, 10, 16, 17', 'RISA Compliant', 'Law No. 058/2021'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white border border-gray-200 rounded-sm text-xs font-semibold text-gray-600 shadow-card">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-[#001E2B] to-[#023430] rounded-lg p-10 text-white border border-white/[0.07]">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Ready to make an impact?</h2>
            <p className="text-[#889397] mb-8">Join community leaders, sponsors, and volunteers building a more equitable Rwanda.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/signup')}>
                Get started
              </Button>
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all"
                onClick={() => navigate('/campaigns')}
              >
                Browse campaigns
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
