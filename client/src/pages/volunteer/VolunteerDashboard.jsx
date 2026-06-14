import { useTranslation } from 'react-i18next';
import { Handshake, MapPin, Clock, Users, Star, ArrowRight } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const OPPORTUNITIES = [
  { id: 1, title: 'Community Outreach – Bumbogo', category: 'Field Work', location: 'Bumbogo, Gasabo', hours: '4 hrs/week', spots: 3, skills: ['Communication', 'Kinyarwanda'] },
  { id: 2, title: 'Youth Mentorship – Digital Skills', category: 'Training', location: 'Kacyiru, Gasabo', hours: '2 hrs/week', spots: 5, skills: ['Digital Skills', 'Teaching'] },
  { id: 3, title: 'Impact Photography & Reporting', category: 'Content', location: 'Kimironko', hours: '3 hrs/week', spots: 2, skills: ['Photography', 'Writing'] },
  { id: 4, title: 'Data Entry & Campaign Support', category: 'Remote', location: 'Remote', hours: '5 hrs/week', spots: 8, skills: ['Computer Literacy', 'Accuracy'] },
];

const CATEGORY_COLORS = {
  'Field Work': 'bg-brand-50 text-brand-700',
  'Training': 'bg-forest-50 text-forest-700',
  'Content': 'bg-blue-50 text-blue-700',
  'Remote': 'bg-purple-50 text-purple-700',
};

export default function VolunteerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]} 🤝</h1>
          <p className="text-sm text-gray-500 mt-1">Your volunteer contributions make Rwanda stronger.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Hours Volunteered" value="24" icon={Clock} trend={20} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Activities Joined" value="6" icon={Handshake} iconColor="text-forest-500" iconBg="bg-forest-50" />
        <StatsCard label="Families Reached" value="89" icon={Users} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatsCard label="Impact Score" value="82/100" icon={Star} trend={12} iconColor="text-forest-500" iconBg="bg-forest-50" />
      </div>

      {/* Certificate banner */}
      <div className="card p-6 bg-gradient-to-br from-[#1a1a2e] to-[#2d3561] text-white flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">🏅</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold">Community Impact Certificate</h3>
          <p className="text-gray-400 text-sm mt-0.5">Complete 40 volunteer hours to earn your certificate of recognition.</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-brand-400" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">24/40 hours completed</p>
        </div>
        <Button variant="secondary" size="sm" className="flex-shrink-0 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">View Progress</Button>
      </div>

      {/* Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a1a2e]">Open Opportunities</h3>
          <span className="text-xs text-gray-400">{OPPORTUNITIES.length} available</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {OPPORTUNITIES.map((opp) => (
            <div key={opp.id} className="card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className={`badge ${CATEGORY_COLORS[opp.category]}`}>{opp.category}</span>
                <span className="text-xs text-gray-400">{opp.spots} spots left</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a1a2e]">{opp.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><MapPin size={11} />{opp.location}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{opp.hours}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {opp.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">{s}</span>
                ))}
              </div>
              <Button variant="secondary" size="sm" className="mt-auto">Apply Now</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
