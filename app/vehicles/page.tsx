'use client';
import { useState, useCallback, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import FullVehicleTable from '@/components/tables/FullVehicleTable';
import DateRangePicker from '@/components/shared/DateRangePicker';
import CountUpNumber from '@/components/shared/CountUpNumber';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard';
import { downloadBlob, fmtNum } from '@/lib/utils';
import api from '@/lib/axios';
import { Download, RefreshCw, CalendarDays, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { VehicleRecord, PaginationMeta } from '@/types';

export default function VehiclesPage() {
  const { filters } = useFilters();
  const [page, setPage]       = useState(1);
  const [sortKey, setSortKey] = useState('wllWeighIn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isOver25h, setIsOver25h] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const dateFilters = selectedDate ? { dateFrom: selectedDate, dateTo: selectedDate } : {};

  const { data, isLoading, refetch } = useVehicles({
    ...filters,
    ...dateFilters,
    isOver25h,
    page,
    limit: 50,
    sortKey,
    sortDir,
  });

  // Lightweight per-day KPIs + transporter breakdown, only fetched once a
  // date is actually picked — reuses the existing dashboard aggregation
  // endpoints instead of a bespoke one.
  const { data: dayOverview, isLoading: dayLoading } = useDashboardOverview({
    ...filters,
    ...dateFilters,
  });

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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries({ ...filters, ...dateFilters, isOver25h, sortKey, sortDir }).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      params.append('export', 'xlsx');
      const response = await api.get(`/vehicles?${params}`, { responseType: 'blob' });
      downloadBlob(response.data, `vehicles_${Date.now()}.xlsx`);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell title="Data Table">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Left panel — date filter + transporter summary */}
        <div className="space-y-4 lg:sticky lg:top-[70px] lg:self-start">
          <div className="panel-card relative overflow-visible">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={14} className="text-gold" />
              <h3 className="text-xs font-bold text-text">Filter by Date</h3>
            </div>
            <div className="relative">
              <DateRangePicker value={selectedDate} onChange={handleDateChange} />
            </div>
          </div>

          {selectedDate && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total', value: dayOverview?.kpis?.total, cls: 'text-gold' },
                  { label: 'Fix', value: dayOverview?.kpis?.fixLoads, cls: 'text-blue' },
                  { label: 'Non-Fix', value: dayOverview?.kpis?.nonFixLoads, cls: 'text-green' },
                  { label: '>25H', value: dayOverview?.kpis?.over25, cls: 'text-red' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="panel-card p-3">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-muted2 mb-1">{label}</div>
                    <div className={`text-lg font-bold font-mono ${cls}`}>
                      {dayLoading ? <span className="skeleton inline-block h-4 w-8 rounded" /> : <CountUpNumber value={value} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel-card">
                <div className="mb-3 flex items-center gap-2">
                  <Truck size={14} className="text-gold" />
                  <h3 className="text-xs font-bold text-text">Transporter Breakdown</h3>
                </div>
                {dayLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-7 rounded" />)}
                  </div>
                ) : transporterCounts.length === 0 ? (
                  <p className="text-[10px] text-muted">No loads on this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {transporterCounts.map((t) => (
                      <div key={t.transporter} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-panel2 transition-colors">
                        <span className="truncate text-[11px] text-text">{t.transporter}</span>
                        <span className="ml-2 shrink-0 rounded-md bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-gold">
                          {fmtNum(t.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Main table */}
        <div className="panel-card min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-text mr-auto">Vehicle Records</h2>

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

            <button onClick={() => refetch()} className="btn-ghost p-1.5">
              <RefreshCw size={13} />
            </button>
            <button onClick={handleExport} disabled={exporting} className="btn-ghost text-xs">
              {exporting
                ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-muted2/20 border-t-muted2" /> Exporting…</>
                : <><Download size={12} /> Export</>
              }
            </button>
          </div>

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
