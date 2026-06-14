import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'RWF') {
  return new Intl.NumberFormat('en-RW', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ' + currency;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-RW', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function progressPercent(raised, target) {
  if (!target) return 0;
  return Math.min(Math.round((raised / target) * 100), 100);
}

export function categoryColor(category) {
  const map = {
    education: 'bg-blue-50 text-blue-700 border-blue-200',
    healthcare: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    food_security: 'bg-amber-50 text-amber-700 border-amber-200',
    emergency: 'bg-red-50 text-red-700 border-red-200',
    housing: 'bg-purple-50 text-purple-700 border-purple-200',
    youth_employment: 'bg-forest-50 text-forest-700 border-forest-200',
  };
  return map[category] || 'bg-gray-50 text-gray-700 border-gray-200';
}

export function statusColor(status) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    pending_review: 'bg-amber-50 text-amber-700',
    approved: 'bg-forest-50 text-forest-700',
    rejected: 'bg-red-50 text-red-700',
    active: 'bg-forest-50 text-forest-700',
    completed: 'bg-brand-50 text-brand-700',
    paused: 'bg-gray-100 text-gray-600',
    pending: 'bg-amber-50 text-amber-700',
    verified: 'bg-forest-50 text-forest-700',
    completed_donation: 'bg-forest-50 text-forest-700',
    failed: 'bg-red-50 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export const MOCK_CAMPAIGNS = [
  {
    _id: '1',
    title: 'School Supplies for Bumbogo Children',
    description: 'Providing exercise books, pens, and school bags to 120 children in Bumbogo sector who cannot afford basic school supplies.',
    category: 'education',
    targetAmount: 1500000,
    raisedAmount: 980000,
    donorCount: 34,
    beneficiaryCount: 120,
    community: 'Bumbogo',
    district: 'Gasabo',
    status: 'active',
    isUrgent: false,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
    endDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
    leaderId: { fullName: 'Marie Uwimana', community: 'Bumbogo', avatar: '' },
    progressPercent: 65,
  },
  {
    _id: '2',
    title: 'Medical Support for Kimironko Elderly',
    description: 'Monthly medication and health screening for 45 elderly residents in Kimironko who lack access to healthcare services.',
    category: 'healthcare',
    targetAmount: 2000000,
    raisedAmount: 2000000,
    donorCount: 58,
    beneficiaryCount: 45,
    community: 'Kimironko',
    district: 'Gasabo',
    status: 'completed',
    isUrgent: false,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
    endDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    leaderId: { fullName: 'Jean Paul Habimana', community: 'Kimironko', avatar: '' },
    progressPercent: 100,
  },
  {
    _id: '3',
    title: 'Youth Digital Skills Bootcamp',
    description: 'A 3-month digital skills program for 60 unemployed youth aged 18–28 in Kacyiru, covering web development, digital marketing, and data entry.',
    category: 'youth_employment',
    targetAmount: 3500000,
    raisedAmount: 1200000,
    donorCount: 22,
    beneficiaryCount: 60,
    community: 'Kacyiru',
    district: 'Gasabo',
    status: 'active',
    isUrgent: true,
    isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    leaderId: { fullName: 'Claudine Mukamana', community: 'Kacyiru', avatar: '' },
    progressPercent: 34,
  },
  {
    _id: '4',
    title: 'Emergency Food Parcels – Flood Victims',
    description: 'Providing two-week emergency food packages to 200 families in Nyamirambo displaced by recent flooding.',
    category: 'food_security',
    targetAmount: 4000000,
    raisedAmount: 3100000,
    donorCount: 91,
    beneficiaryCount: 200,
    community: 'Nyamirambo',
    district: 'Nyarugenge',
    status: 'active',
    isUrgent: true,
    isFeatured: false,
    coverImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    leaderId: { fullName: 'Patrick Nkurunziza', community: 'Nyamirambo', avatar: '' },
    progressPercent: 78,
  },
  {
    _id: '5',
    title: 'Temporary Shelter Construction – Gitega',
    description: 'Building 8 transitional shelters for homeless families in Gitega sector using locally-sourced materials.',
    category: 'housing',
    targetAmount: 5500000,
    raisedAmount: 1650000,
    donorCount: 17,
    beneficiaryCount: 8,
    community: 'Gitega',
    district: 'Nyarugenge',
    status: 'active',
    isUrgent: false,
    isFeatured: false,
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    endDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
    leaderId: { fullName: 'Solange Iradukunda', community: 'Gitega', avatar: '' },
    progressPercent: 30,
  },
  {
    _id: '6',
    title: 'Secondary School Scholarships – Gisozi',
    description: 'Full-year tuition support for 25 academically gifted students from low-income families in Gisozi sector.',
    category: 'education',
    targetAmount: 2500000,
    raisedAmount: 2250000,
    donorCount: 43,
    beneficiaryCount: 25,
    community: 'Gisozi',
    district: 'Gasabo',
    status: 'active',
    isUrgent: false,
    isFeatured: false,
    coverImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80',
    endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    leaderId: { fullName: 'Olivier Tuyisenge', community: 'Gisozi', avatar: '' },
    progressPercent: 90,
  },
];
