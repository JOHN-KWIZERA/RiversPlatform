import { cn } from '../../lib/utils';

export default function Progress({ value = 0, className, showLabel = false, size = 'md' }) {
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      <div className={cn('progress-bar', heights[size], className)}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-gray-500 mt-1">{pct}% funded</p>}
    </div>
  );
}

export function CircularProgress({ value = 0, size = 64, strokeWidth = 5, className }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className={cn('-rotate-90', className)}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#d1fae5" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#00684A"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}
