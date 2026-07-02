'use client';
import { useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { fmtNum, fmtHours, pct } from '@/lib/utils';
import ViolationBarChart from '@/components/charts/ViolationBarChart';
import SparklineChart from '@/components/charts/SparklineChart';
import CountUpNumber from '@/components/shared/CountUpNumber';
import type { DivisionStats, DivisionMonthlyTrend } from '@/types';

function DivisionCard({ d, trend }: { d: DivisionStats; trend: number[] }) {
  const vRate = d.violationRate ?? 0;
  const color = vRate > 20 ? 'text-red' : vRate > 10 ? 'text-gold' : 'text-green';
  const barW  = `${Math.min(vRate, 100)}%`;
  const sparkColor = vRate > 20 ? '#ef4444' : vRate > 10 ? '#f59e0b' : '#10b981';

  return (
    <div className="panel-card ring-1 ring-line hover:ring-gold/30 transition-all animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-text truncate">{d.division}</span>
        <span className={`text-xs font-bold font-mono shrink-0 ml-2 ${color}`}>
          <CountUpNumber value={vRate} decimals={1} formatter={pct} />
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-panel3 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${vRate > 20 ? 'bg-red' : vRate > 10 ? 'bg-gold' : 'bg-green'}`}
          style={{ width: barW }}
        />
      </div>

      {/* Mini trend chart */}
      <SparklineChart data={trend} color={sparkColor} className="mb-3" />

      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'Total',    value: fmtNum(d.total),    cls: 'text-gold' },
          { label: 'Fix',      value: fmtNum(d.fix),      cls: 'text-blue' },
          { label: 'Detention', value: fmtNum(d.over25),  cls: 'text-red' },
          { label: 'Avg Hrs',  value: fmtHours(d.avgHours), cls: 'text-muted' },
        ].map(({ label, value, cls }) => (
          <div key={label}>
            <div className={`text-xs font-bold font-mono ${cls}`}>{value}</div>
            <div className="text-[9px] text-muted2 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildTrendMap(rows: DivisionMonthlyTrend[]): Map<string, number[]> {
  const map = new Map<string, { key: number; count: number }[]>();
  rows.forEach((r) => {
    const key = r.year * 12 + r.month;
    if (!map.has(r.division)) map.set(r.division, []);
    map.get(r.division)!.push({ key, count: r.count });
  });
  const result = new Map<string, number[]>();
  map.forEach((points, division) => {
    const sorted = [...points].sort((a, b) => a.key - b.key).slice(-6);
    result.set(division, sorted.map((p) => p.count));
  });
  return result;
}

export default function DivisionPage() {
  const { filters } = useFilters();
  const { data, isLoading } = useDashboardOverview(filters);
  const divisions = data?.byDivision ?? [];
  const trendMap = useMemo(() => buildTrendMap(data?.divisionMonthly ?? []), [data?.divisionMonthly]);

  return (
    <AppShell title="By Division">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="xl:col-span-2 panel-card">
          <h3 className="text-xs font-bold text-text mb-4">Violation Rate by Division</h3>
          <ViolationBarChart data={divisions} loading={isLoading} />
        </div>

        <div className="panel-card">
          <h3 className="text-xs font-bold text-text mb-4">Summary</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {divisions.slice(0, 6).map((d) => (
                <div key={d.division} className="flex items-center justify-between py-1.5 border-b border-line last:border-none">
                  <span className="text-xs text-text truncate">{d.division}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted font-mono">{fmtNum(d.total)}</span>
                    <span className={`text-[10px] font-bold font-mono ${d.violationRate > 20 ? 'text-red' : d.violationRate > 10 ? 'text-gold' : 'text-green'}`}>
                      {pct(d.violationRate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Division cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)
          : divisions.map((d) => <DivisionCard key={d.division} d={d} trend={trendMap.get(d.division) ?? []} />)
        }
      </div>
    </AppShell>
  );
}
