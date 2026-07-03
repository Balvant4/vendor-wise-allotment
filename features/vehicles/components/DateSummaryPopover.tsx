'use client';
import { useEffect, useRef, useState } from 'react';
import { BarChart3, Truck, ChevronDown } from 'lucide-react';
import CountUpNumber from '@/components/shared/CountUpNumber';
import { fmtNum, cn } from '@/lib/utils';

interface Kpis {
  total?: number;
  fixLoads?: number;
  nonFixLoads?: number;
  over25?: number;
}

interface TransporterCount {
  transporter: string;
  total: number;
}

interface Props {
  kpis?: Kpis;
  transporterCounts: TransporterCount[];
  loading: boolean;
  disabled: boolean; // true when no date/time filter is applied — nothing meaningful to summarize
}

// Replaces the old always-on sidebar KPI cards + transporter list with an
// on-demand popover. Same data, but it no longer eats vertical space when
// the user isn't looking at a specific date range.
export default function DateSummaryPopover({ kpis, transporterCounts, loading, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 text-[11px] font-medium text-muted transition-all',
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-text'
        )}
        title={disabled ? 'Apply a date/time range to see a summary' : undefined}
      >
        <BarChart3 size={12} />
        Summary
        <ChevronDown size={11} className="opacity-60" />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border border-line bg-panel p-3.5 shadow-2xl animate-fade-up">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Total', value: kpis?.total, cls: 'text-gold' },
              { label: 'Fix', value: kpis?.fixLoads, cls: 'text-blue' },
              { label: 'Non-Fix', value: kpis?.nonFixLoads, cls: 'text-green' },
              { label: '>25H', value: kpis?.over25, cls: 'text-red' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded-lg border border-line bg-panel2 p-2">
                <div className="text-[9px] font-bold uppercase tracking-wide text-muted2 mb-0.5">{label}</div>
                <div className={`text-base font-bold font-mono ${cls}`}>
                  {loading ? <span className="skeleton inline-block h-4 w-8 rounded" /> : <CountUpNumber value={value} />}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <Truck size={12} className="text-gold" />
            <h4 className="text-[11px] font-bold text-text">Transporter Breakdown</h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-6 rounded" />)
            ) : transporterCounts.length === 0 ? (
              <p className="text-[10px] text-muted">No loads in this range.</p>
            ) : (
              transporterCounts.map((t) => (
                <div key={t.transporter} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-panel2">
                  <span className="truncate text-[11px] text-text">{t.transporter}</span>
                  <span className="ml-2 shrink-0 rounded-md bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-gold">
                    {fmtNum(t.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
