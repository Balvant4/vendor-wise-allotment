'use client';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

// Tiny inline trend line for vendor / division cards. No axes, no grid,
// no tooltip — just a shape that communicates "trending up/down/flat".
export default function SparklineChart({ data, color = '#f59e0b', height = 32, className }: SparklineChartProps) {
  if (!data || data.length < 2) {
    return <div className={className} style={{ height }} />;
  }

  const points = data.map((v, i) => ({ i, v }));

  return (
    <div className={className} style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
