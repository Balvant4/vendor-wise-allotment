'use client';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { DivisionStats } from '@/types';
import { fmtNum } from '@/lib/utils';

interface Props { data: DivisionStats[]; loading?: boolean }

const COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];

const tooltip = {
  contentStyle: { background: '#0e1420', border: '1px solid #1f2d45', borderRadius: 8, fontSize: 11 },
  labelStyle:   { color: '#f1f5f9', fontWeight: 700 },
  itemStyle:    { color: '#94a3b8' },
};

export default function DivisionDonutChart({ data, loading }: Props) {
  if (loading) return <div className="skeleton h-52 rounded-lg w-full" />;
  if (!data.length) return (
    <div className="flex h-52 items-center justify-center text-xs text-muted">No division data</div>
  );

  const chartData = data.map((d) => ({ name: d.division, value: d.total }));

  return (
    <div className="h-52 w-full chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={50} outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            {...tooltip}
            formatter={(value: number) => [fmtNum(value), 'Loads']}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: '#64748b' }}
            formatter={(value) => <span className="text-muted text-[10px]">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
