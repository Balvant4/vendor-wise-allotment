import { memo } from 'react';
import { CalendarDays } from 'lucide-react';
import { DAYS } from '@/lib/utils';

interface Props {
  weekdayCounts: number[];
  loading?: boolean;
}

function WeekdayPatternPanel({ weekdayCounts, loading }: Props) {
  const max = Math.max(1, ...weekdayCounts);

  return (
    <div className="panel-card">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays size={14} className="text-gold" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">By Day of Week</h3>
      </div>
      {loading ? (
        <div className="skeleton h-24 rounded" />
      ) : (
        <div className="flex items-end justify-between gap-1.5 h-24">
          {weekdayCounts.map((count, i) => (
            <div key={DAYS[i]} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-muted">{count > 0 ? count : ''}</span>
              <div
                className="w-full rounded-t bg-gold/70"
                style={{ height: `${Math.max(4, (count / max) * 64)}px` }}
              />
              <span className="text-[10px] text-muted2">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(WeekdayPatternPanel);