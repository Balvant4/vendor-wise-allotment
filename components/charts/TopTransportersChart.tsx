'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { TransporterStats } from '@/types';

interface Props { data: TransporterStats[]; loading?: boolean }

const tooltip = {
  contentStyle: { background: '#0e1420', border: '1px solid #1f2d45', borderRadius: 8, fontSize: 11 },
  labelStyle:   { color: '#f1f5f9', fontWeight: 700 },
  itemStyle:    { color: '#94a3b8' },
};

const BAR_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

export default function TopTransportersChart({ data, loading }: Props) {
  if (loading) return <div className="skeleton h-52 rounded-lg w-full" />;

  const top5 = [...data]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((d) => ({ name: d.transporter, Loads: d.total }))
    .reverse(); // so #1 renders at the top of the horizontal chart

  if (!top5.length) {
    return <div className="flex h-52 items-center justify-center text-xs text-muted">No data yet</div>;
  }

  return (
    <div className="h-52 w-full chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top5} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip {...tooltip} cursor={{ fill: 'rgba(245,158,11,0.06)' }} />
          <Bar dataKey="Loads" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {top5.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[(top5.length - 1 - i) % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
