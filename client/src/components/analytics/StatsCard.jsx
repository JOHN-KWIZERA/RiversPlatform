import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({ label, value, subtext, icon: Icon, iconColor = 'text-brand-500', iconBg = 'bg-brand-50', trend, trendValue, className }) {
  return (
    <div className={cn('card p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            trend > 0 ? 'bg-forest-50 text-forest-700' : trend < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
          )}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trendValue || trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1a1a2e] tracking-tight">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
