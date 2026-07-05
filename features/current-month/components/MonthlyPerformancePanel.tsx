import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Gauge, Timer, TrendingUp, CheckCircle2, AlertOctagon, ShieldCheck } from 'lucide-react';
import { pct, fmtHours } from '@/lib/utils';

// Static color→class map (same convention as components/shared/KpiCard.tsx)
// — Tailwind can't purge-detect dynamically interpolated class names, so
// this stays a lookup table rather than `bg-${color}/10` string building.
const colorMap = {
  gold:   { ring: 'ring-gold/20',   bg: 'bg-gold/10',   text: 'text-gold'   },
  green:  { ring: 'ring-green/20',  bg: 'bg-green/10',  text: 'text-green'  },
  red:    { ring: 'ring-red/20',    bg: 'bg-red/10',    text: 'text-red'    },
  blue:   { ring: 'ring-blue/20',   bg: 'bg-blue/10',   text: 'text-blue'   },
  purple: { ring: 'ring-purple/20', bg: 'bg-purple/10', text: 'text-purple' },
  cyan:   { ring: 'ring-cyan/20',   bg: 'bg-cyan/10',   text: 'text-cyan'   },
} as const;

type ColorKey = keyof typeof colorMap;

function Metric({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: ColorKey }) {
  const c = colorMap[color];
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-line bg-panel2 px-3 py-2.5 ring-1 ${c.ring}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.bg} ring-1 ${c.ring}`}>
        <Icon size={14} className={c.text} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</div>
        <div className={`text-sm font-bold font-mono ${c.text}`}>{value}</div>
      </div>
    </div>
  );
}

interface Props {
  avgHours?: number;
  avgLoadingMinutes?: number;
  completionRate?: number;
  violationRate?: number;
  avgPerDay?: number;
  loading?: boolean;
}

function MonthlyPerformancePanel({ avgHours, avgLoadingMinutes, completionRate, violationRate, avgPerDay, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
      </div>
    );
  }

  const deliverySuccess = violationRate !== undefined ? Math.max(0, 100 - violationRate) : undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Metric icon={Timer}        label="Avg Turnaround"    value={fmtHours(avgHours)}                             color="cyan" />
      <Metric icon={Gauge}        label="Avg Loading Time"  value={avgLoadingMinutes ? `${avgLoadingMinutes}m` : '—'} color="blue" />
      <Metric icon={CheckCircle2} label="Completion Rate"   value={pct(completionRate)}                             color="green" />
      <Metric icon={AlertOctagon} label="Delay %"           value={pct(violationRate)}                              color="red" />
      <Metric icon={TrendingUp}   label="Avg Vehicles/Day"  value={avgPerDay !== undefined ? avgPerDay.toFixed(1) : '—'} color="gold" />
      <Metric icon={ShieldCheck}  label="Delivery Success"  value={pct(deliverySuccess)}                             color="purple" />
    </div>
  );
}

export default memo(MonthlyPerformancePanel);