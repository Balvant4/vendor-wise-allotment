'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DailyTrend } from '@/types';

interface Props { data: DailyTrend[]; loading?: boolean }

const tooltip = {
  contentStyle: { background: '#0e1420', border: '1px solid #1f2d45', borderRadius: 8, fontSize: 11 },
  labelStyle:   { color: '#f1f5f9', fontWeight: 700 },
  itemStyle:    { color: '#94a3b8' },
};

export default function DailyLineChart({ data, loading }: Props) {
  if (loading) return <div className="skeleton h-44 rounded-lg w-full" />;
  if (!data.length) return (
    <div className="flex h-44 items-center justify-center text-xs text-muted">No daily data</div>
  );

  const chartData = data.map((d) => ({
    date:  d.date,
    Total: d.count,
    '>25H': d.over25,
  }));

  return (
    <div className="h-44 w-full chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip {...tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
          <Line dataKey="Total" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line dataKey=">25H"  stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
