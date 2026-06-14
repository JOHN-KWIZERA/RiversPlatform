import { cn } from '../../lib/utils';

export default function Badge({ children, className, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-brand-50 text-brand-700 border border-brand-200',
    forest: 'bg-forest-50 text-forest-700 border border-forest-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
  };
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}
