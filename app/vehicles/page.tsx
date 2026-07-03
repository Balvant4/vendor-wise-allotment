'use client';
import { useCallback, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import FullVehicleTable from '@/components/tables/FullVehicleTable';
import DateTimeRangeFilter, { type DateTimeRangeValue } from '@/features/vehicles/components/DateTimeRangeFilter';
import DateSummaryPopover from '@/features/vehicles/components/DateSummaryPopover';
import ActiveFilterChips, { type FilterChip } from '@/features/vehicles/components/ActiveFilterChips';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadBlob, MONTHS } from '@/lib/utils';
import api from '@/lib/axios';
import { Download, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { VehicleRecord, PaginationMeta } from '@/types';

const FIELD_LABELS: Record<string, string> = {
  wllWeighIn: 'WLL In',
  wllWeighOut: 'WLL Out',
  loadingStartTime: 'Loading Start',
  loadingEndTime: 'Loading End',
  gateInDate: 'Gate In',
  exciseOutDate: 'Excise Out',
};

function fmtChipDate(iso: string): string {
  if (!iso) return '…';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '…';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function VehiclesPage() {
  const { filters, setFilter, resetFilters } = useFilters();

  const [page, setPage]       = useState(1);
  const [sortKey, setSortKey] = useState('wllWeighIn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isOver25h, setIsOver25h] = useState('');
  const [exporting, setExporting] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, 400);

  const [range, setRange] = useState<DateTimeRangeValue>({ dateFrom: '', dateTo: '', dateField: 'wllWeighIn' });
  const hasRange = !!(range.dateFrom || range.dateTo);

  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      dateField: range.dateField,
      isOver25h,
    }),
    [filters, debouncedSearch, range, isOver25h]
  );

  const { data, isLoading, refetch, isFetching } = useVehicles({
    ...queryFilters,
    page,
    limit: 50,
    sortKey,
    sortDir,
  });

  // Summary popover data — only meaningfully fetched once a date/time range is applied.
  const { data: dayOverview, isLoading: dayLoading } = useDashboardOverview(hasRange ? queryFilters : {});

  const records: VehicleRecord[]   = data?.data ?? [];
  const pagination: Partial<PaginationMeta> = data?.pagination ?? {};

  const transporterCounts = useMemo(
    () => [...(dayOverview?.byTransporter ?? [])].sort((a, b) => b.total - a.total),
    [dayOverview]
  );

  const handleSort = useCallback((key: string) => {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }, [sortKey]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries({ ...queryFilters, sortKey, sortDir }).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      params.append('export', 'xlsx');
      const response = await api.get(`/vehicles?${params}`, { responseType: 'blob' });
      downloadBlob(response.data, `vehicles_${Date.now()}.xlsx`);
      toast.success('Export downloaded — matches your current filters');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // ── Active filter chips ──────────────────────────────────────────────────
  const chips: FilterChip[] = [];
  if (hasRange) {
    chips.push({
      key: 'range',
      label: `${FIELD_LABELS[range.dateField]}: ${fmtChipDate(range.dateFrom)} – ${fmtChipDate(range.dateTo)}`,
      onRemove: () => setRange({ dateFrom: '', dateTo: '', dateField: range.dateField }),
    });
  }
  if (isOver25h) {
    chips.push({
      key: 'status',
      label: isOver25h === 'true' ? 'Status: >25H' : 'Status: Normal',
      onRemove: () => setIsOver25h(''),
    });
  }
  if (filters.division) {
    chips.push({ key: 'division', label: `Division: ${filters.division}`, onRemove: () => setFilter('division', '') });
  }
  if (filters.isFix) {
    chips.push({ key: 'isFix', label: filters.isFix === 'true' ? 'Fix only' : 'Non-Fix only', onRemove: () => setFilter('isFix', '') });
  }
  if (filters.year) {
    chips.push({ key: 'year', label: `Year: ${filters.year}`, onRemove: () => setFilter('year', '') });
  }
  if (filters.month) {
    chips.push({ key: 'month', label: `Month: ${MONTHS[Number(filters.month) - 1]}`, onRemove: () => setFilter('month', '') });
  }
  if (localSearch) {
    chips.push({ key: 'search', label: `Search: "${localSearch}"`, onRemove: () => setLocalSearch('') });
  }

  const handleResetAll = () => {
    resetFilters();
    setIsOver25h('');
    setLocalSearch('');
    setRange({ dateFrom: '', dateTo: '', dateField: 'wllWeighIn' });
    setPage(1);
  };

  return (
    <AppShell title="Data Table">
      <div className="panel-card min-w-0 !p-0 overflow-hidden">
        {/* Compact toolbar — every filter lives here, right above the table,
            instead of a separate sidebar panel eating vertical space. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-text mr-1 shrink-0">Vehicle Records</h2>

          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
            <input
              value={localSearch}
              onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
              placeholder="Vehicle, container, doc no…"
              className="h-7 w-40 sm:w-52 rounded-lg border border-line bg-panel2 pl-7 pr-2 text-xs
                         text-text placeholder:text-muted2 outline-none focus:border-gold
                         focus:ring-1 focus:ring-gold/10 transition-all"
            />
          </div>

          <DateTimeRangeFilter value={range} onChange={(v) => { setRange(v); setPage(1); }} />

          <div className="flex items-center gap-1 rounded-lg border border-line bg-panel2 p-0.5">
            {[
              { label: 'All',    value: '' },
              { label: '>25H',   value: 'true' },
              { label: 'Normal', value: 'false' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setIsOver25h(value); setPage(1); }}
                className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                  isOver25h === value ? 'bg-gold text-black' : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <DateSummaryPopover
            kpis={dayOverview?.kpis}
            transporterCounts={transporterCounts}
            loading={dayLoading}
            disabled={!hasRange}
          />

          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => refetch()} className="btn-ghost p-1.5" title="Refresh">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleExport} disabled={exporting} className="btn-ghost text-xs">
              {exporting
                ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-muted2/20 border-t-muted2" /> Exporting…</>
                : <><Download size={12} /> Export</>
              }
            </button>
          </div>
        </div>

        <ActiveFilterChips chips={chips} onResetAll={handleResetAll} />

        <div className="p-4">
          <FullVehicleTable
            data={records}
            loading={isLoading}
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
