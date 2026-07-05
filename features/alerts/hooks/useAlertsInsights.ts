import { useMemo, useState } from 'react';
import { severityFromHours } from '@/components/shared/StatusBadge';
import type { VehicleRecord } from '@/types';
import type {
  AlertsInsights, AlertsSummary, LoadTypeFilter, UseAlertsInsightsResult,
} from '../types';

/**
 * Owns all filter state + derived data for the Alerts page: the dropdown
 * filters, the sort direction, and every summary/breakdown panel's numbers.
 *
 * Sorting is deliberately kept OUT of the insight calculations — `baseFiltered`
 * (division/transporter/load-type filtered, unsorted) is the single source
 * both `summary`/`insights` and the sorted table read from. That way toggling
 * sort direction only re-sorts the table rows; it doesn't recompute every
 * breakdown panel, and downstream memoized panels can skip re-rendering.
 */
export function useAlertsInsights(data: VehicleRecord[]): UseAlertsInsightsResult {
  const [divisionFilter, setDivisionFilter] = useState('');
  const [transporterFilter, setTransporterFilter] = useState('');
  const [loadTypeFilter, setLoadTypeFilter] = useState<LoadTypeFilter>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const divisions = useMemo(
    () => Array.from(new Set(data.map((r) => r.division))).sort(),
    [data]
  );
  const transporters = useMemo(
    () => Array.from(new Set(data.map((r) => r.transporter))).sort(),
    [data]
  );

  const baseFiltered = useMemo(() => {
    let rows = data;
    if (divisionFilter) rows = rows.filter((r) => r.division === divisionFilter);
    if (transporterFilter) rows = rows.filter((r) => r.transporter === transporterFilter);
    if (loadTypeFilter === 'fix') rows = rows.filter((r) => r.isFix);
    if (loadTypeFilter === 'nonfix') rows = rows.filter((r) => !r.isFix);
    return rows;
  }, [data, divisionFilter, transporterFilter, loadTypeFilter]);

  const sortedRows = useMemo(() => {
    return [...baseFiltered].sort((a, b) =>
      sortDir === 'asc' ? a.diffHours - b.diffHours : b.diffHours - a.diffHours
    );
  }, [baseFiltered, sortDir]);

  const summary: AlertsSummary = useMemo(() => {
    if (!baseFiltered.length) return { total: 0, avg: 0, max: 0, totalHours: 0 };
    const total = baseFiltered.length;
    const totalHours = baseFiltered.reduce((s, r) => s + r.diffHours, 0);
    const avg = totalHours / total;
    const max = Math.max(...baseFiltered.map((r) => r.diffHours));
    return { total, avg, max, totalHours };
  }, [baseFiltered]);

  const insights: AlertsInsights = useMemo(() => {
    const byTransporter = new Map<string, { count: number; hours: number }>();
    const byWarehouse = new Map<string, { count: number; hours: number }>();
    const byVehicle = new Map<string, { count: number; hours: number; transporter: string }>();
    const byReason = new Map<string, number>();
    const severityCounts = { low: 0, medium: 0, high: 0 };
    const weekdayCounts = Array(7).fill(0) as number[];

    baseFiltered.forEach((r) => {
      const t = byTransporter.get(r.transporter) ?? { count: 0, hours: 0 };
      t.count += 1; t.hours += r.diffHours;
      byTransporter.set(r.transporter, t);

      const w = byWarehouse.get(r.division) ?? { count: 0, hours: 0 };
      w.count += 1; w.hours += r.diffHours;
      byWarehouse.set(r.division, w);

      const v = byVehicle.get(r.vehicleNo) ?? { count: 0, hours: 0, transporter: r.transporter };
      v.count += 1; v.hours += r.diffHours;
      byVehicle.set(r.vehicleNo, v);

      const reason = r.detentionReason?.trim() || 'Not specified';
      byReason.set(reason, (byReason.get(reason) ?? 0) + 1);

      const sev = severityFromHours(r.diffHours);
      if (sev === 'low' || sev === 'medium' || sev === 'high') severityCounts[sev] += 1;

      if (typeof r.dayOfWeek === 'number') weekdayCounts[r.dayOfWeek] += 1;
    });

    const sortByCount = (entries: [string, { count: number; hours: number }][]) =>
      entries.sort((a, b) => b[1].count - a[1].count);

    return {
      byTransporter: sortByCount([...byTransporter.entries()]),
      byWarehouse: sortByCount([...byWarehouse.entries()]),
      repeatVehicles: [...byVehicle.entries()]
        .filter(([, v]) => v.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5),
      reasons: [...byReason.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      severityCounts,
      weekdayCounts,
    };
  }, [baseFiltered]);

  return {
    divisions, transporters,
    divisionFilter, setDivisionFilter,
    transporterFilter, setTransporterFilter,
    loadTypeFilter, setLoadTypeFilter,
    sortDir, setSortDir,
    baseFiltered, sortedRows,
    summary, insights,
  };
}