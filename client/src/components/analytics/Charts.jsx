import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#00684A', '#2d6a4f', '#00A35C', '#4dab84', '#023430', '#1d4d32'];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  boxShadow: '0 2px 8px rgba(0,30,43,0.12)',
  fontSize: '13px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
};

const axisStyle = { fontSize: 11, fill: '#9ca3af' };

export function DonationAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00684A" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00684A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`RWF ${v?.toLocaleString()}`, 'Donations']} />
        <Area type="monotone" dataKey="total" stroke="#00684A" strokeWidth={2} fill="url(#colorAmount)" dot={false} activeDot={{ r: 4, fill: '#00684A' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CampaignBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="_id" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="#00684A" radius={[4, 4, 0, 0]} />
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
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
