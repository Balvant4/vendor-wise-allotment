'use client';
import { DAYS, fmtNum } from '@/lib/utils';

interface HeatmapGridProps {
  data: { dayOfWeek: number; count: number }[];
  loading?: boolean;
}

// Day-of-week load volume heatmap. dayOfWeek is 0 (Sun) – 6 (Sat), matching
// the value the ingest pipeline already stamps on every VehicleRecord.
export default function HeatmapGrid({ data, loading }: HeatmapGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const found = data.find((d) => d.dayOfWeek === i);
    return { dayOfWeek: i, count: found?.count ?? 0 };
  });

  const max = Math.max(1, ...byDay.map((d) => d.count));

  const colorFor = (ratio: number) => {
    if (ratio === 0) return 'bg-panel3';
    if (ratio < 0.25) return 'bg-gold/20';
    if (ratio < 0.5) return 'bg-gold/40';
    if (ratio < 0.75) return 'bg-gold/70';
    return 'bg-gold';
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {byDay.map((d) => {
        const ratio = d.count / max;
        const isPeak = d.count === max && d.count > 0;
        return (
          <div
            key={d.dayOfWeek}
            className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 transition-all
                        ring-1 ${isPeak ? 'ring-gold/40' : 'ring-line'} ${colorFor(ratio)}`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wide ${ratio > 0.5 ? 'text-black/70' : 'text-muted'}`}>
              {DAYS[d.dayOfWeek]}
            </span>
            <span className={`text-sm font-bold font-mono ${ratio > 0.5 ? 'text-black' : 'text-text'}`}>
              {fmtNum(d.count)}
            </span>
            {isPeak && (
              <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-red ring-2 ring-bg" title="Busiest day" />
            )}
          </div>
        );
      })}
    </div>
  );
}
