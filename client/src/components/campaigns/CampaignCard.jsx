import { MapPin, Users, Clock, Zap, CheckCircle2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency, categoryColor, progressPercent } from '../../lib/utils';
import Progress from '../ui/Progress';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function CampaignCard({ campaign, onDonate }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pct = progressPercent(campaign.raisedAmount, campaign.targetAmount);
  const daysLeft = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate) - Date.now()) / 86400000))
    : null;

  return (
    <div className="card-hover flex flex-col overflow-hidden group" onClick={() => navigate(`/campaigns/${campaign._id}`)}>
      {/* Cover image */}
      <div className="relative h-44 bg-brand-100 overflow-hidden flex-shrink-0">
        {campaign.coverImage ? (
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-100 to-parchment flex items-center justify-center">
            <Globe size={36} className="text-brand-300" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {campaign.isUrgent && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Zap size={10} /> {t('campaigns.urgent')}
            </span>
          )}
          {campaign.status === 'completed' && (
            <span className="flex items-center gap-1 bg-forest-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              <CheckCircle2 size={10} /> {t('campaigns.completed')}
            </span>
          )}
        </div>
        {/* Category */}
        <span className={cn('badge absolute bottom-3 left-3 border text-xs', categoryColor(campaign.category))}>
          {t(`categories.${campaign.category}`)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-[#1a1a2e] text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
            {campaign.title}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
            <MapPin size={11} />
            <span>{campaign.community}{campaign.district ? `, ${campaign.district}` : ''}</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <Progress value={pct} />
          <div className="flex justify-between text-xs mt-1.5">
            <span className="font-semibold text-brand-600">{formatCurrency(campaign.raisedAmount)}</span>
            <span className="text-gray-400">{t('common.of')} {formatCurrency(campaign.targetAmount)}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{campaign.donorCount} {t('campaigns.donors')}</span>
          </div>
          {daysLeft !== null && campaign.status !== 'completed' && (
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>{daysLeft} {t('campaigns.days_left')}</span>
            </div>
          )}
        </div>

        {/* Leader */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <Avatar name={campaign.leaderId?.fullName || 'Leader'} size="xs" />
          <span className="text-xs text-gray-500 truncate">{campaign.leaderId?.fullName}</span>
        </div>

        {/* Action */}
        {campaign.status === 'active' && onDonate && (
          <Button
            variant="primary"
            size="sm"
            className="mt-auto w-full"
            onClick={(e) => { e.stopPropagation(); onDonate(campaign); }}
          >
            {t('campaigns.donate')}
          </Button>
        )}
      </div>
    </div>
  );
}
