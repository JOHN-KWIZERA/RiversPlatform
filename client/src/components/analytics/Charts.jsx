import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
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

export function UserGrowthLineChart({ data }) {
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatted = data.map(d => ({ month: MONTH_NAMES[(d._id?.month ?? 1) - 1], users: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'New users']} />
        <Line type="monotone" dataKey="users" stroke="#00A35C" strokeWidth={2} dot={{ r: 3, fill: '#00A35C' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusDistributionChart({ data }) {
  const STATUS_COLORS = {
    active: '#00684A', completed: '#00A35C', pending_review: '#d97706',
    draft: '#9ca3af', rejected: '#ef4444', approved: '#2d6a4f', paused: '#6b7280',
  };
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis dataKey="_id" type="category" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} width={80}
          tickFormatter={(v) => v?.replace('_', ' ')} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Campaigns']} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry._id] || '#9ca3af'} />
          ))}
        </Bar>
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
