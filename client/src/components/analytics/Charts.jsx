import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#c45c26', '#2d6a4f', '#f4a261', '#4dab84', '#8f3d17', '#1d4d32'];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #f2d9bc',
  borderRadius: '12px',
  boxShadow: '0 4px 24px -4px rgba(196,92,38,0.15)',
  fontSize: '13px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
};

export function DonationAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c45c26" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#c45c26" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5ead5" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`RWF ${v?.toLocaleString()}`, 'Donations']} />
        <Area type="monotone" dataKey="total" stroke="#c45c26" strokeWidth={2.5} fill="url(#colorAmount)" dot={false} activeDot={{ r: 5, fill: '#c45c26' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CampaignBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5ead5" />
        <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="#2d6a4f" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="_id">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export const MOCK_MONTHLY = [
  { month: 'Jan', total: 850000 },
  { month: 'Feb', total: 1200000 },
  { month: 'Mar', total: 980000 },
  { month: 'Apr', total: 1450000 },
  { month: 'May', total: 2100000 },
  { month: 'Jun', total: 1800000 },
];

export const MOCK_CATEGORIES = [
  { _id: 'Education', count: 12 },
  { _id: 'Healthcare', count: 8 },
  { _id: 'Food', count: 6 },
  { _id: 'Youth', count: 9 },
  { _id: 'Housing', count: 4 },
];
