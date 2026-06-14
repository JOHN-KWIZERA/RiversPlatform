import { cn } from '../../lib/utils';
import Spinner from './Spinner';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  forest: 'btn-forest',
  danger: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizes = {
  sm: '!px-3 !py-1.5 !text-xs',
  md: '',
  lg: '!px-6 !py-3 !text-base',
  xl: '!px-8 !py-4 !text-base !rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <button className={cn(variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner size={16} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
