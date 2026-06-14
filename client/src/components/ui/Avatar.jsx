import { cn } from '../../lib/utils';

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const avatarColors = [
  'bg-brand-100 text-brand-700',
  'bg-forest-100 text-forest-700',
  'bg-amber-50 text-amber-700',
  'bg-blue-50 text-blue-700',
  'bg-purple-50 text-purple-700',
];

function colorFromName(name = '') {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export default function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)} />;
  }
  return (
    <span className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0', sizes[size], colorFromName(name), className)}>
      {getInitials(name)}
    </span>
  );
}
