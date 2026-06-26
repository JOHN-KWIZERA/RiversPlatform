import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({ label, value, subtext, icon: Icon, iconColor = 'text-brand-500', iconBg = 'bg-brand-50', trend, trendValue, className }) {
  return (
    <div className={cn('card p-5 flex flex-col gap-4 hover:border-gray-300 transition-all duration-200', className)}>
      <div className="flex items-start justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
            trend > 0 ? 'bg-forest-50 text-forest-700' : trend < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
          )}>
            {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trendValue || trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-[#001E2B] tracking-tight leading-none">{value}</p>
        <p className="text-sm font-semibold text-gray-500 mt-2">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
