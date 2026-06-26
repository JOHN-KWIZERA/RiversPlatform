import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, MapPin, Clock, Users, ArrowRight, Search } from 'lucide-react';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const CARD_ACCENTS = [
  'bg-[#001E2B]',
  'bg-[#00684A]',
  'bg-[#1a3a4a]',
  'bg-[#004d38]',
  'bg-[#002a3a]',
];

export default function VolunteerOpportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      opportunityApi.getAll({ status: 'open' }),
      opportunityApi.getMyApplications().catch(() => []),
    ]).then(([oppData, apps]) => {
      setOpportunities(oppData.opportunities || []);
      const appList = Array.isArray(apps) ? apps : [];
      setAppliedIds(new Set(appList.map(a => a.opportunityId?._id || a.opportunityId)));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = opportunities.filter(opp =>
    !search ||
    opp.title?.toLowerCase().includes(search.toLowerCase()) ||
    opp.community?.toLowerCase().includes(search.toLowerCase()) ||
    opp.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSlots = opportunities.reduce((a, o) => a + Math.max(0, (o.slots || 0) - (o.filledSlots || 0)), 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src="https://picsum.photos/seed/volunteer-community-work/1200/400"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001E2B]/95 via-[#001E2B]/80 to-[#001E2B]/40" />
        <div className="relative px-8 py-10 flex flex-col gap-4">
          <p className="text-[10px] font-bold tracking-widest text-[#00ED64] uppercase">Open Volunteer Roles</p>
          <h1 className="text-3xl font-black text-white leading-snug max-w-md">
            Your community needs you.
          </h1>
          <p className="text-white/55 text-sm max-w-sm leading-relaxed">
            Skills and presence matter as much as money. Find where you fit and apply to make a real difference.
          </p>
          {!loading && (
            <div className="flex gap-8 mt-1">
              <div>
                <p className="text-2xl font-black text-white">{opportunities.length}</p>
                <p className="text-xs text-white/40 mt-0.5">Open roles</p>
              </div>
              <div className="border-l border-white/10 pl-8">
                <p className="text-2xl font-black text-white">{totalSlots}</p>
                <p className="text-xs text-white/40 mt-0.5">Slots available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by title, community, or skill…"
        leftElement={<Search size={15} />}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Handshake size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search ? 'No opportunities match your search.' : 'No volunteer opportunities available right now. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp, i) => {
            const slotsLeft = Math.max(0, (opp.slots || 0) - (opp.filledSlots || 0));
            const applied   = appliedIds.has(opp._id);
            const accent    = CARD_ACCENTS[i % CARD_ACCENTS.length];

            return (
              <div
                key={opp._id}
                className="group border border-gray-200 rounded-2xl overflow-hidden hover:border-brand-300 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
                onClick={() => navigate(`/dashboard/opportunities/${opp._id}`)}
              >
                {/* Colored header block */}
                <div className={`${accent} px-5 py-5 flex items-start justify-between gap-3`}>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">{opp.title}</h4>
                    <p className="flex items-center gap-1 text-white/50 text-xs mt-1.5">
                      <MapPin size={10} /> {opp.district || opp.community}
                    </p>
                  </div>
                  {applied ? (
                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00ED64]/20 text-[#00ED64] border border-[#00ED64]/30">
                      Applied
                    </span>
                  ) : slotsLeft > 0 ? (
                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {slotsLeft} left
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                      Full
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {opp.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {stripHtml(opp.description)}
                    </p>
                  )}

                  {opp.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {opp.skills.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">{s}</span>
                      ))}
                      {opp.skills.length > 4 && (
                        <span className="text-[11px] text-gray-400 self-center">+{opp.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} />{opp.startDate ? formatDate(opp.startDate) : 'Flexible'}</span>
                    <span className={cn('flex items-center gap-1 font-semibold', slotsLeft > 0 ? 'text-forest-600' : 'text-red-400')}>
                      <Users size={10} /> {slotsLeft > 0 ? `${slotsLeft} spots` : 'Full'}
                    </span>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); navigate(applied ? `/dashboard/opportunities/${opp._id}` : `/dashboard/opportunities/${opp._id}/apply`); }}
                    disabled={!applied && slotsLeft <= 0}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-colors',
                      applied
                        ? 'bg-forest-50 text-forest-700 border border-forest-200'
                        : slotsLeft > 0
                        ? 'bg-[#001E2B] text-white hover:bg-[#002a3a]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {applied ? 'View application' : slotsLeft > 0 ? <>Apply now <ArrowRight size={12} /></> : 'No spots left'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
