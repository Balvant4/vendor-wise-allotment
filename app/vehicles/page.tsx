'use client';
import { useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import VehicleTable from '@/components/tables/VehicleTable';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { downloadBlob } from '@/lib/utils';
import api from '@/lib/axios';
import { Download, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { VehicleRecord, PaginationMeta } from '@/types';

export default function VehiclesPage() {
  const { filters } = useFilters();
  const [page, setPage]       = useState(1);
  const [sortKey, setSortKey] = useState('reportingDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isOver25h, setIsOver25h] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch } = useVehicles({
    ...filters,
    isOver25h,
    page,
    limit: 50,
    sortKey,
    sortDir,
  });

  const records: VehicleRecord[]   = data?.data ?? [];
  const pagination: Partial<PaginationMeta> = data?.pagination ?? {};

  const handleSort = useCallback((key: string) => {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }, [sortKey]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries({ ...filters, isOver25h, sortKey, sortDir }).forEach(([k, v]) => {
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
      <div className="panel-card">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-text mr-auto">Vehicle Records</h2>

          {/* Over 25H toggle */}
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
                  isOver25h === value
                    ? 'bg-gold text-black'
                    : 'text-muted hover:text-text'
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

        <VehicleTable
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
    </AppShell>
  );
}
