'use client';
import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAlerts } from '@/features/dashboard/hooks/useDashboard';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { fmtDate, fmtHours, fmtNum } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { severityFromHours } from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import CountUpNumber from '@/components/shared/CountUpNumber';
import { AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import type { VehicleRecord } from '@/types';

type SortKey = 'diffHours' | 'wllWeighIn';

export default function AlertsPage() {
  const { filters } = useFilters();
  const { data = [], isLoading } = useAlerts(filters);

  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [transporterFilter, setTransporterFilter] = useState('');
  const [loadTypeFilter, setLoadTypeFilter] = useState<'' | 'fix' | 'nonfix'>('');

  const divisions = useMemo(
    () => Array.from(new Set(data.map((r) => r.division))).sort(),
    [data]
  );
  const transporters = useMemo(
    () => Array.from(new Set(data.map((r) => r.transporter))).sort(),
    [data]
  );

  const filtered = useMemo(() => {
    let rows = [...data];
    if (divisionFilter) rows = rows.filter((r) => r.division === divisionFilter);
    if (transporterFilter) rows = rows.filter((r) => r.transporter === transporterFilter);
    if (loadTypeFilter === 'fix') rows = rows.filter((r) => r.isFix);
    if (loadTypeFilter === 'nonfix') rows = rows.filter((r) => !r.isFix);
    rows.sort((a, b) => sortDir === 'asc' ? a.diffHours - b.diffHours : b.diffHours - a.diffHours);
    return rows;
  }, [data, divisionFilter, transporterFilter, loadTypeFilter, sortDir]);

  const summary = useMemo(() => {
    if (!filtered.length) return { total: 0, avg: 0, max: 0, worstDivision: '—' };
    const total = filtered.length;
    const avg = filtered.reduce((s, r) => s + r.diffHours, 0) / total;
    const max = Math.max(...filtered.map((r) => r.diffHours));
    const counts = new Map<string, number>();
    filtered.forEach((r) => counts.set(r.division, (counts.get(r.division) ?? 0) + 1));
    const worstDivision = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { total, avg, max, worstDivision };
  }, [filtered]);

  return (
    <AppShell title="Alerts">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red/10 ring-1 ring-red/20">
          <AlertTriangle size={18} className="text-red" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text">Company Detention Cases</h2>
          <p className="text-[10px] text-muted">WLL Weightment IN→OUT exceeding 25 hours — internal cause, not a transporter fault</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Cases', value: summary.total, cls: 'text-red', fmt: fmtNum },
          { label: 'Avg Detention', value: summary.avg, cls: 'text-gold', fmt: fmtHours },
          { label: 'Max Detention', value: summary.max, cls: 'text-red', fmt: fmtHours },
        ].map(({ label, value, cls, fmt }) => (
          <div key={label} className="kpi-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">{label}</div>
            <div className={`text-xl font-bold font-mono ${cls}`}>
              {isLoading ? <span className="skeleton inline-block h-5 w-12 rounded" /> : <CountUpNumber value={value} decimals={label === 'Total Cases' ? 0 : 1} formatter={fmt} />}
            </div>
          </div>
        ))}
        <div className="kpi-card">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Most Detained Division</div>
          <div className="text-xl font-bold font-mono text-purple truncate">
            {isLoading ? <span className="skeleton inline-block h-5 w-16 rounded" /> : summary.worstDivision}
          </div>
        </div>
      </div>

      <div className="panel-card">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="fb-select">
            <option value="">All divisions</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={transporterFilter} onChange={(e) => setTransporterFilter(e.target.value)} className="fb-select">
            <option value="">All transporters</option>
            {transporters.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={loadTypeFilter} onChange={(e) => setLoadTypeFilter(e.target.value as typeof loadTypeFilter)} className="fb-select">
            <option value="">Fix + Non-Fix</option>
            <option value="fix">Fix Only</option>
            <option value="nonfix">Non-Fix Only</option>
          </select>
          <button
            onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
            className="btn-ghost text-xs ml-auto"
          >
            Duration {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {!isLoading && <Badge variant="red" className="text-xs px-2 py-1">{filtered.length} cases</Badge>}
        </div>

        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No detention cases found"
            message="All loads are within the 25-hour threshold for the selected filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr>
                  {[
                    'Sr. No', 'Document No', 'Warehouse', 'End Customer', 'Container No',
                    'Transporter', 'Vehicle No', 'WLL IN', 'WLL OUT', 'Duration',
                    'Detention Reason', 'Other Reason', 'Load Type',
                  ].map((h) => (
                    <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: VehicleRecord, i: number) => {
                  const severity = severityFromHours(r.diffHours);
                  return (
                    <tr
                      key={r._id}
                      className={`transition-colors animate-fade-up ${i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'} hover:bg-panel2`}
                    >
                      <td className="table-td font-mono">{i + 1}</td>
                      <td className="table-td font-mono">{r.documentNumber || '—'}</td>
                      <td className="table-td">{r.division}</td>
                      <td className="table-td truncate max-w-[140px]">{r.customerName || r.endCustName || '—'}</td>
                      <td className="table-td font-mono">{r.containerNo}</td>
                      <td className="table-td">{r.transporter}</td>
                      <td className="table-td font-mono font-semibold text-text">{r.vehicleNo}</td>
                      <td className="table-td whitespace-nowrap">{fmtDate(r.wllWeighIn)}</td>
                      <td className="table-td whitespace-nowrap">{fmtDate(r.wllWeighOut)}</td>
                      <td className="table-td">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold ${
                          severity === 'high' ? 'text-red' : severity === 'medium' ? 'text-red' : 'text-orange-400'
                        }`}>
                          {severity === 'high' && <span className="h-1.5 w-1.5 rounded-full bg-red animate-pulse" />}
                          {fmtHours(r.diffHours)}
                        </span>
                      </td>
                      <td className="table-td truncate max-w-[140px]">{r.detentionReason || '—'}</td>
                      <td className="table-td truncate max-w-[140px]">{r.otherReason || '—'}</td>
                      <td className="table-td">
                        <Badge variant={r.isFix ? 'blue' : 'gray'}>{r.isFix ? 'Fix' : 'Non-Fix'}</Badge>
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
