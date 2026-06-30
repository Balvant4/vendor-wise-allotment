'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { MONTHS } from '@/lib/utils';
import type { MonthlyTrend } from '@/types';

interface Props { data: MonthlyTrend[]; loading?: boolean }

const tooltip = {
  contentStyle: { background: '#0e1420', border: '1px solid #1f2d45', borderRadius: 8, fontSize: 11 },
  labelStyle:   { color: '#f1f5f9', fontWeight: 700 },
  itemStyle:    { color: '#94a3b8' },
};

export default function MonthlyBarChart({ data, loading }: Props) {
  if (loading) return <div className="skeleton h-52 rounded-lg w-full" />;

  const chartData = data.map((d) => ({
    name:  `${MONTHS[d.month - 1]} ${d.year}`,
    Total: d.count,
    '>25H': d.over25,
  }));

  return (
    <div className="h-52 w-full chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip {...tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
          <Bar dataKey="Total" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={36} />
          <Bar dataKey=">25H"  fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
