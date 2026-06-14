import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-brand-50 text-brand-700 border border-brand-200',
  forest: 'bg-forest-50 text-forest-700 border border-forest-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
};

const dotColors = {
  default: 'bg-gray-400',
  primary: 'bg-brand-500',
  forest: 'bg-forest-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function Badge({ children, className, variant = 'default', dot = false }) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-soft', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
