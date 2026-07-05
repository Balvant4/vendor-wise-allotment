'use client';
import { useCallback, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/shared/KpiCard';
import FullVehicleTable from '@/components/tables/FullVehicleTable';
import ActiveFilterChips, { type FilterChip } from '@/features/vehicles/components/ActiveFilterChips';
import DailyLineChart from '@/components/charts/DailyLineChart';
import DivisionDonutChart from '@/components/charts/DivisionDonutChart';
import TopTransportersChart from '@/components/charts/TopTransportersChart';
import BreakdownBarList from '@/features/alerts/components/BreakdownBarList';
import MonthlyPerformancePanel from '@/features/current-month/components/MonthlyPerformancePanel';
import CurrentMonthExportBar from '@/features/current-month/components/CurrentMonthExportBar';
import {
  useCurrentMonthOverview, useCurrentMonthDaily, useCurrentMonthInsights,
  usePreviousMonthKpis, getCurrentMonthRange,
} from '@/features/current-month/hooks/useCurrentMonth';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { useFilterOptions } from '@/features/dashboard/hooks/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { fmtNum, fmtHours, pct } from '@/lib/utils';
import {
  Truck, Package, Users2, FileSpreadsheet, Boxes, Building2, CheckCircle2,
  Hourglass, AlertTriangle, TrendingUp, TrendingDown, Search, RefreshCw, Trophy, CalendarClock,
} from 'lucide-react';
import type { VehicleRecord, PaginationMeta } from '@/types';

export default function CurrentMonthPage() {
  const { label, daysElapsed } = getCurrentMonthRange();

  // ── Overview (KPIs + by-division + by-transporter + day-of-week), daily
  // trend, and the current-month-specific insights — all scoped to the
  // rolling "1st of this month → now" window computed in the hook. ──
  const { data: overview, isLoading: overviewLoading, refetch, isFetching } = useCurrentMonthOverview();
  const { data: daily = [], isLoading: dailyLoading } = useCurrentMonthDaily();
  const { data: insights, isLoading: insightsLoading } = useCurrentMonthInsights();
  const { data: prevKpis } = usePreviousMonthKpis();
  const { data: filterOptions } = useFilterOptions();

  const kpis          = overview?.kpis;
  const byDivision    = overview?.byDivision    ?? [];
  const byTransporter = overview?.byTransporter ?? [];

  // ── Table-only local filters (independent of the fixed month window) ──
  const [division, setDivision]       = useState('');
  const [transporter, setTransporter] = useState('');
  const [customer, setCustomer]       = useState('');
  const [container, setContainer]    = useState('');
  const [status, setStatus]           = useState<'' | 'true' | 'false'>('');
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, 400);
  const [page, setPage]       = useState(1);
  const [sortKey, setSortKey] = useState('wllWeighIn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { dateFrom, dateTo } = getCurrentMonthRange();

  const queryFilters = useMemo(
    () => ({
      dateField: 'wllWeighIn',
      dateFrom, dateTo,
      division, transporter, customer, container,
      isOver25h: status,
      search: debouncedSearch,
    }),
    [dateFrom, dateTo, division, transporter, customer, container, status, debouncedSearch]
  );

  const { data: tableData, isLoading: tableLoading } = useVehicles({
    ...queryFilters, page, limit: 50, sortKey, sortDir,
  });
  const records: VehicleRecord[] = tableData?.data ?? [];
  const pagination: Partial<PaginationMeta> = tableData?.pagination ?? {};

  const handleSort = useCallback((key: string) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }, [sortKey]);

  // ── Derived insights that don't need their own API call ──
  const avgPerDay = kpis?.total !== undefined ? kpis.total / Math.max(daysElapsed, 1) : undefined;

  const growthPct = useMemo(() => {
    if (!kpis?.total || !prevKpis?.total) return null;
    return Math.round(((kpis.total - prevKpis.total) / prevKpis.total) * 1000) / 10;
  }, [kpis, prevKpis]);

  const { busiest, quietest } = useMemo(() => {
    if (!daily.length) return { busiest: null, quietest: null };
    let busiest = daily[0];
    let quietest = daily[0];
    for (const d of daily) {
      if (d.count > busiest.count) busiest = d;
      if (d.count < quietest.count) quietest = d;
    }
    return { busiest, quietest };
  }, [daily]);

  const mostActiveTransporter = byTransporter[0];
  const mostActiveDivision    = [...byDivision].sort((a, b) => b.total - a.total)[0];

  const topCustomerItems = (insights?.topCustomers ?? []).map((c) => ({
    key: c.customerName, label: c.customerName, value: c.count, sublabel: fmtNum(c.count),
  }));
  const topDestinationItems = (insights?.topDestinations ?? []).map((d) => ({
    key: d.endCustName, label: d.endCustName, value: d.count, sublabel: fmtNum(d.count),
  }));

  // ── Active filter chips ──
  const chips: FilterChip[] = [];
  if (division)    chips.push({ key: 'division',    label: `Division: ${division}`,    onRemove: () => setDivision('') });
  if (transporter) chips.push({ key: 'transporter', label: `Transporter: ${transporter}`, onRemove: () => setTransporter('') });
  if (customer)    chips.push({ key: 'customer',    label: `Customer: ${customer}`,     onRemove: () => setCustomer('') });
  if (container)   chips.push({ key: 'container',   label: `Container: ${container}`,   onRemove: () => setContainer('') });
  if (status)      chips.push({ key: 'status', label: status === 'true' ? 'Status: >25H' : 'Status: Normal', onRemove: () => setStatus('') });
  if (localSearch) chips.push({ key: 'search', label: `Search: "${localSearch}"`, onRemove: () => setLocalSearch('') });

  const resetAll = () => {
    setDivision(''); setTransporter(''); setCustomer(''); setContainer('');
    setStatus(''); setLocalSearch(''); setPage(1);
  };

  const kpisForExport = {
    'Total Loads': kpis?.total ?? 0,
    'Over 25H': kpis?.over25 ?? 0,
    'Completed': insights?.completed ?? 0,
    'Pending': insights?.pending ?? 0,
  };

  return (
    <AppShell title="Current Month">
      {/* Banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-panel to-panel px-4 sm:px-5 py-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-text">Current Month — {label}</h1>
          <p className="text-[11px] sm:text-xs text-muted mt-0.5">
            Day 1 – Day {daysElapsed}, updating automatically as the month progresses. No manual date changes needed.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost text-xs">
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-5">
        <KpiCard label="Total Vehicles"     value={kpis?.uniqueVehicles}     icon={Truck}         color="purple" loading={overviewLoading} />
        <KpiCard label="Total Containers"   value={insights?.totalContainers} icon={Boxes}         color="blue"   loading={insightsLoading} />
        <KpiCard label="Total Trips"        value={kpis?.total}               icon={Package}       color="gold"   loading={overviewLoading} />
        <KpiCard label="Active Transporters" value={kpis?.uniqueTransporters} icon={Users2}        color="cyan"   loading={overviewLoading} />
        <KpiCard label="Total Divisions"    value={kpis?.uniqueDivisions}     icon={Building2}     color="green"  loading={overviewLoading} />
        <KpiCard label="Total Customers"    value={insights?.totalCustomers}  icon={Users2}        color="purple" loading={insightsLoading} />
        <KpiCard label="Total Documents"    value={insights?.totalDocuments}  icon={FileSpreadsheet} color="blue" loading={insightsLoading} />
        <KpiCard label="Completed"          value={insights?.completed}       icon={CheckCircle2}  color="green"  loading={insightsLoading} sub={`${pct(insights?.completionRate)} of total`} />
        <KpiCard label="Pending"            value={insights?.pending}         icon={Hourglass}     color="gold"   loading={insightsLoading} />
        <KpiCard label="Delayed (>25H)"      value={kpis?.over25}              icon={AlertTriangle} color="red"    loading={overviewLoading} sub={`${pct(kpis?.violationRate)} rate`} />
        <KpiCard label="Avg Vehicles/Day"    value={avgPerDay}                 icon={TrendingUp}    color="cyan"   loading={overviewLoading} decimals={1} />
        <KpiCard
          label="Vs Last Month"
          value={growthPct ?? undefined}
          icon={growthPct !== null && growthPct < 0 ? TrendingDown : TrendingUp}
          color={growthPct !== null && growthPct < 0 ? 'red' : 'green'}
          loading={overviewLoading}
          decimals={1}
          formatter={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2 panel-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-text">Daily Vehicle Trend</h3>
            <span className="badge bg-panel3 text-muted2 ring-1 ring-line">Vehicle movement by date</span>
          </div>
          <DailyLineChart data={daily} loading={dailyLoading} />
        </div>
        <div className="panel-card">
          <div className="mb-3 text-xs font-bold text-text">Division-wise Vehicles</div>
          <DivisionDonutChart data={byDivision} loading={overviewLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="panel-card">
          <div className="mb-3 text-xs font-bold text-text">Transporter-wise Vehicles</div>
          <TopTransportersChart data={byTransporter} loading={overviewLoading} />
        </div>
        <BreakdownBarList
          icon={Users2}
          iconColorClass="text-blue"
          barColorClass="bg-blue"
          title="Customer-wise Vehicles"
          items={topCustomerItems}
          loading={insightsLoading}
          emptyMessage="No customer data for this month yet."
        />
      </div>

      {/* Monthly performance */}
      <div className="panel-card mb-4">
        <div className="mb-3 text-xs font-bold text-text">Monthly Performance</div>
        <MonthlyPerformancePanel
          avgHours={kpis?.avgHours}
          avgLoadingMinutes={insights?.avgLoadingMinutes}
          completionRate={insights?.completionRate}
          violationRate={kpis?.violationRate}
          avgPerDay={avgPerDay}
          loading={overviewLoading || insightsLoading}
        />
      </div>

      {/* Monthly insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="panel-card">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-text">
            <Trophy size={14} className="text-gold" /> Top Performers
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Most active transporter</span>
              <span className="font-semibold text-text">{mostActiveTransporter?.transporter ?? '—'}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Most active division</span>
              <span className="font-semibold text-text">{mostActiveDivision?.division ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total transporters used</span>
              <span className="font-semibold text-text">{fmtNum(kpis?.uniqueTransporters)}</span>
            </div>
          </div>
        </div>
        <div className="panel-card">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-text">
            <CalendarClock size={14} className="text-cyan" /> Busiest / Quietest Day
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Busiest day this month</span>
              <span className="font-semibold text-green">{busiest ? `${busiest.date} (${fmtNum(busiest.count)})` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Least busy day</span>
              <span className="font-semibold text-red">{quietest ? `${quietest.date} (${fmtNum(quietest.count)})` : '—'}</span>
            </div>
          </div>
        </div>
        <BreakdownBarList
          icon={Package}
          iconColorClass="text-purple"
          barColorClass="bg-purple"
          title="Top Destinations"
          items={topDestinationItems}
          loading={insightsLoading}
          emptyMessage="No destination data for this month yet."
        />
      </div>

      {/* Data table */}
      <div className="panel-card min-w-0 !p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-text mr-1 shrink-0">Current Month Records</h2>

          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
            <input
              value={localSearch}
              onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
              placeholder="Vehicle, container, doc no…"
              className="h-7 w-40 sm:w-48 rounded-lg border border-line bg-panel2 pl-7 pr-2 text-xs
                         text-text placeholder:text-muted2 outline-none focus:border-gold
                         focus:ring-1 focus:ring-gold/10 transition-all"
            />
          </div>

          <select
            value={division}
            onChange={(e) => { setDivision(e.target.value); setPage(1); }}
            className="h-7 rounded-lg border border-line bg-panel2 px-2 text-xs text-text outline-none focus:border-gold"
          >
            <option value="">All Divisions</option>
            {(filterOptions?.divisions ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={transporter}
            onChange={(e) => { setTransporter(e.target.value); setPage(1); }}
            className="h-7 rounded-lg border border-line bg-panel2 px-2 text-xs text-text outline-none focus:border-gold max-w-[10rem]"
          >
            <option value="">All Transporters</option>
            {(filterOptions?.transporters ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <input
            value={customer}
            onChange={(e) => { setCustomer(e.target.value); setPage(1); }}
            placeholder="Customer…"
            className="h-7 w-32 rounded-lg border border-line bg-panel2 px-2 text-xs text-text
                       placeholder:text-muted2 outline-none focus:border-gold"
          />

          <input
            value={container}
            onChange={(e) => { setContainer(e.target.value); setPage(1); }}
            placeholder="Container…"
            className="h-7 w-32 rounded-lg border border-line bg-panel2 px-2 text-xs text-text
                       placeholder:text-muted2 outline-none focus:border-gold"
          />

          <div className="flex items-center gap-1 rounded-lg border border-line bg-panel2 p-0.5">
            {[{ label: 'All', value: '' }, { label: '>25H', value: 'true' }, { label: 'Normal', value: 'false' }].map(({ label: l, value }) => (
              <button
                key={value}
                onClick={() => { setStatus(value as '' | 'true' | 'false'); setPage(1); }}
                className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                  status === value ? 'bg-gold text-black' : 'text-muted hover:text-text'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <CurrentMonthExportBar filters={{ ...queryFilters, sortKey, sortDir }} rows={records} kpis={kpisForExport} />
          </div>
        </div>

        <ActiveFilterChips chips={chips} onResetAll={resetAll} />

        <div className="p-4">
          <FullVehicleTable
            data={records}
            loading={tableLoading}
            total={pagination.total ?? 0}
            page={page}
            limit={50}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onPage={(p) => setPage(p)}
          />
        </div>
      </div>
    </AppShell>
  );
}