import { memo } from 'react';
import { Clock3 } from 'lucide-react';
import { fmtNum } from '@/lib/utils';
import type { AlertsInsights } from '../types';

const BUCKETS = [
  { key: 'low' as const,    label: '25h – 48h', dot: 'bg-orange-400' },
  { key: 'medium' as const, label: '48h – 72h', dot: 'bg-red' },
  { key: 'high' as const,   label: '72h+',      dot: 'bg-red' },
];

interface Props {
  severityCounts: AlertsInsights['severityCounts'];
  loading?: boolean;
}

function SeverityBreakdownPanel({ severityCounts, loading }: Props) {
  const max = Math.max(1, ...Object.values(severityCounts));

  return (
    <div className="panel-card">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 size={14} className="text-red" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Severity Breakdown</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
        </div>
      ) : (
        <div className="space-y-2.5">
          {BUCKETS.map(({ key, label, dot }) => {
            const count = severityCounts[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="inline-flex items-center gap-1.5 text-text font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <span className="font-mono text-muted">{fmtNum(count)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-panel2 overflow-hidden">
                  <div className={`h-full rounded-full ${dot}`} style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(SeverityBreakdownPanel);