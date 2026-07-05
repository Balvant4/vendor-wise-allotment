import { type LucideIcon } from 'lucide-react';
import { memo } from 'react';
import { cn, fmtNum } from '@/lib/utils';
import CountUpNumber from './CountUpNumber';

const colorMap = {
  gold:   { ring: 'ring-gold/20',   bg: 'bg-gold/10',   text: 'text-gold',   dot: 'bg-gold'   },
  green:  { ring: 'ring-green/20',  bg: 'bg-green/10',  text: 'text-green',  dot: 'bg-green'  },
  red:    { ring: 'ring-red/20',    bg: 'bg-red/10',    text: 'text-red',    dot: 'bg-red'    },
  blue:   { ring: 'ring-blue/20',   bg: 'bg-blue/10',   text: 'text-blue',   dot: 'bg-blue'   },
  purple: { ring: 'ring-purple/20', bg: 'bg-purple/10', text: 'text-purple', dot: 'bg-purple' },
  cyan:   { ring: 'ring-cyan/20',   bg: 'bg-cyan/10',   text: 'text-cyan',   dot: 'bg-cyan'   },
} as const;

type ColorKey = keyof typeof colorMap;

interface KpiCardProps {
  label: string;
  value?: number | null;
  sub?: string;
  icon?: LucideIcon;
  color?: ColorKey;
  loading?: boolean;
  /** Defaults to fmtNum — pass fmtHours etc. for non-count metrics. */
  formatter?: (n: number) => string;
  /** Decimal places CountUpNumber should animate/round to. Defaults to 0. */
  decimals?: number;
}

function KpiCard({
  label, value, sub, icon: Icon, color = 'gold', loading,
  formatter = fmtNum as (n: number) => string, decimals = 0,
}: KpiCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="kpi-card">
        <div className="skeleton h-3 w-20 rounded mb-3" />
        <div className="skeleton h-7 w-16 rounded mb-2" />
        <div className="skeleton h-2 w-24 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('kpi-card ring-1 animate-kpi-entry', c.ring)}>
      <div className={cn('pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl', c.dot)} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</span>
        {Icon && (
          <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg ring-1', c.bg, c.ring)}>
            <Icon size={14} className={c.text} />
          </div>
        )}
      </div>
      <div className={cn('text-2xl font-bold font-mono', c.text)}>
        <CountUpNumber value={value} formatter={formatter} decimals={decimals} />
      </div>
      {sub && <div className="mt-1 text-[10px] text-muted">{sub}</div>}
    </div>
  );
}

export default memo(KpiCard);