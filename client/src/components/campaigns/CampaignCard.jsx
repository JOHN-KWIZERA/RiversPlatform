import { MapPin, Users, Clock, Zap, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency, categoryColor, progressPercent } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function CampaignCard({ campaign, onDonate, detailBasePath = '/campaigns' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pct = progressPercent(campaign.raisedAmount, campaign.targetAmount);
  const daysLeft = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate) - Date.now()) / 86400000))
    : null;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`${detailBasePath}/${campaign._id}`)}
    >
      {/* Cover image */}
      <div className="relative h-52 bg-gradient-to-br from-brand-50 to-[#e8f5ef] flex-shrink-0 overflow-hidden">
        {campaign.coverImage ? (
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe size={44} className="text-brand-200" />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3">
          {campaign.isUrgent && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
              <Zap size={9} /> {t('campaigns.urgent')}
            </span>
          )}
        </div>

        {/* Top-right verified badge */}
        <div className="absolute top-3 right-3">
          {(campaign.status === 'active' || campaign.approvedBy) && (
            <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-forest-700 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-forest-100">
              <ShieldCheck size={9} /> Verified
            </span>
          )}
        </div>

        {/* Bottom overlay — category + completed */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className={cn('badge border text-[11px] shadow-sm backdrop-blur-sm', categoryColor(campaign.category))}>
            {t(`categories.${campaign.category}`)}
          </span>
          {campaign.status === 'completed' && (
            <span className="flex items-center gap-1 bg-forest-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              <CheckCircle2 size={9} /> {t('campaigns.completed')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title + Location */}
        <div>
          <h3 className="font-bold text-[#001E2B] text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
            {campaign.title}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
            <MapPin size={10} />
            <span className="truncate">{campaign.community}{campaign.district ? `, ${campaign.district}` : ''}</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="font-bold text-brand-600">{formatCurrency(campaign.raisedAmount)}</span>
            <span className="text-gray-400 font-semibold">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #00684A 0%, #00A35C 60%, #00ED64 100%)',
              }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{t('common.of')} {formatCurrency(campaign.targetAmount)} goal</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{campaign.donorCount ?? 0} {t('campaigns.donors')}</span>
          </div>
          {daysLeft !== null && campaign.status !== 'completed' && (
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>{daysLeft} {t('campaigns.days_left')}</span>
            </div>
          )}
        </div>

        {/* Leader */}
        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-gray-50">
          <Avatar name={campaign.leaderId?.fullName || 'Leader'} size="xs" />
          <span className="text-[11px] text-gray-500 truncate flex-1">{campaign.leaderId?.fullName}</span>
        </div>

        {/* Donate CTA */}
        {campaign.status === 'active' && onDonate && (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onDonate(campaign); }}
          >
            {t('campaigns.donate')}
          </Button>
        )}
      </div>
    </div>
  );
}
