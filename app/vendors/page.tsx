'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { fmtNum, fmtHours, pct } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { TransporterStats } from '@/types';

type SortKey = keyof TransporterStats;

export default function VendorsPage() {
  const { filters }   = useFilters();
  const { data, isLoading } = useDashboardOverview(filters);
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch]   = useState('');

  const raw = data?.byTransporter ?? [];

  const vendors = [...raw]
    .filter((v) => v.transporter.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? (sortDir === 'asc' ? <ChevronUp size={10} className="text-gold" /> : <ChevronDown size={10} className="text-gold" />)
      : <ChevronUp size={10} className="opacity-20" />;

  const COLS: { key: SortKey; label: string }[] = [
    { key: 'transporter',   label: 'Transporter' },
    { key: 'total',         label: 'Total' },
    { key: 'fix',           label: 'Fix' },
    { key: 'over25',        label: '>25H' },
    { key: 'avgHours',      label: 'Avg Hrs' },
    { key: 'maxHours',      label: 'Max Hrs' },
    { key: 'violationRate', label: 'Violation %' },
  ];

  return (
    <AppShell title="Vendors">
      <div className="panel-card">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-sm font-bold text-text mr-auto">Transporter Performance</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transporter…"
            className="h-7 w-44 rounded-lg border border-line bg-panel2 px-3 text-xs
                       text-text placeholder:text-muted2 outline-none focus:border-gold transition-all"
          />
        </div>

        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-9 rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="table-th first:rounded-tl-lg last:rounded-tr-lg cursor-pointer hover:text-text select-none transition-colors"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => {
                  const vr = v.violationRate ?? 0;
                  const vrCls = vr > 20 ? 'text-red' : vr > 10 ? 'text-gold' : 'text-green';
                  return (
                    <tr key={v.transporter} className={i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'}>
                      <td className="table-td text-xs font-semibold text-text">{v.transporter}</td>
                      <td className="table-td font-mono text-xs text-gold">{fmtNum(v.total)}</td>
                      <td className="table-td font-mono text-xs text-blue">{fmtNum(v.fix)}</td>
                      <td className="table-td font-mono text-xs text-red">{fmtNum(v.over25)}</td>
                      <td className="table-td font-mono text-xs text-muted">{fmtHours(v.avgHours)}</td>
                      <td className="table-td font-mono text-xs text-muted">{fmtHours(v.maxHours)}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-16 rounded-full bg-panel3 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${vr > 20 ? 'bg-red' : vr > 10 ? 'bg-gold' : 'bg-green'}`}
                              style={{ width: `${Math.min(vr, 100)}%` }}
                            />
                          </div>
                          <span className={`font-mono text-xs font-semibold ${vrCls}`}>{pct(vr)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
