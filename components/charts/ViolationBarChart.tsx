'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { DivisionStats } from '@/types';

interface Props { data: DivisionStats[]; loading?: boolean }

const tooltip = {
  contentStyle: { background: '#0e1420', border: '1px solid #1f2d45', borderRadius: 8, fontSize: 11 },
  labelStyle:   { color: '#f1f5f9', fontWeight: 700 },
  itemStyle:    { color: '#94a3b8' },
};

export default function ViolationBarChart({ data, loading }: Props) {
  if (loading) return <div className="skeleton h-48 rounded-lg w-full" />;
  if (!data.length) return (
    <div className="flex h-48 items-center justify-center text-xs text-muted">No data</div>
  );

  const sorted = [...data].sort((a, b) => b.violationRate - a.violationRate).slice(0, 8);

  return (
    <div className="h-48 w-full chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={sorted} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <YAxis
            dataKey="division"
            type="category"
            width={56}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip
            {...tooltip}
            formatter={(v: number) => [`${v.toFixed(1)}%`, 'Violation Rate']}
          />
          <Bar dataKey="violationRate" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {sorted.map((d, i) => (
              <Cell
                key={i}
                fill={d.violationRate > 20 ? '#ef4444' : d.violationRate > 10 ? '#f59e0b' : '#10b981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
