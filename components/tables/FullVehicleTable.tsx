'use client';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import { Truck } from 'lucide-react';
import { fmtDateTime, fmtHours, fmtNum } from '@/lib/utils';
import type { VehicleRecord } from '@/types';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: VehicleRecord, i: number) => React.ReactNode;
}

// All 18 source columns from the spec, in order. Sr. No + Container No are
// frozen (sticky) so operators can scroll the wide table horizontally
// without losing track of which row/container they're looking at.
const COLUMNS: Column[] = [
  { key: 'srNo', label: 'Sr. No', render: (_r, i) => i + 1 },
  { key: 'documentNumber', label: 'Document No' },
  { key: 'division', label: 'Warehouse', sortable: true },
  { key: 'customerName', label: 'End Customer' },
  { key: 'containerNo', label: 'Container', sortable: true },
  { key: 'transporter', label: 'Transporter', sortable: true },
  { key: 'vehicleNo', label: 'Vehicle No', sortable: true },
  { key: 'gateInDate', label: 'Gate In', render: (r) => fmtDateTime(r.gateInDate) },
  { key: 'exciseOutDate', label: 'Excise Out', render: (r) => fmtDateTime(r.exciseOutDate) },
  { key: 'gateExciseDiff', label: 'Gate-Excise Diff', render: (r) => r.gateExciseDiff || '—' },
  { key: 'loadingStartTime', label: 'Loading Start', render: (r) => fmtDateTime(r.loadingStartTime) },
  { key: 'loadingEndTime', label: 'Loading End', render: (r) => fmtDateTime(r.loadingEndTime) },
  { key: 'loadingTimeDiff', label: 'Loading Diff', render: (r) => r.loadingTimeDiff || '—' },
  { key: 'wllWeighIn', label: 'WLL Weigh IN', sortable: true, render: (r) => fmtDateTime(r.wllWeighIn) },
  { key: 'wllWeighOut', label: 'WLL Weigh OUT', render: (r) => fmtDateTime(r.wllWeighOut) },
  {
    key: 'diffHours', label: 'Weigh Diff', sortable: true,
    render: (r) => r.hasIncompleteData
      ? <span className="text-muted2 italic">—</span>
      : <span className={`font-mono font-semibold ${r.isOver25h ? 'text-red' : 'text-green'}`}>{fmtHours(r.diffHours)}</span>,
  },
  {
    key: 'isFix', label: 'Load Type',
    render: (r) => <Badge variant={r.isFix ? 'blue' : 'gray'}>{r.isFix ? 'Fix' : 'Non-Fix'}</Badge>,
  },
  {
    key: 'isOver25h', label: 'Status',
    render: (r) => r.hasIncompleteData
      ? <Badge variant="gray">N/A</Badge>
      : r.isOver25h
        ? <Badge variant="red">Company Detention</Badge>
        : <Badge variant="green">OK</Badge>,
  },
];

const FROZEN_KEYS = new Set(['srNo', 'containerNo']);

interface Props {
  data: VehicleRecord[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onPage?: (page: number) => void;
}

export default function FullVehicleTable({
  data, loading, total, page, limit,
  sortKey, sortDir, onSort, onPage,
}: Props) {
  const totalPages = Math.ceil(total / limit) || 1;

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronUp size={10} className="opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="text-gold" />
      : <ChevronDown size={10} className="text-gold" />;
  };

  if (loading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-9 rounded" />)}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState icon={Truck} title="No records found" message="Adjust your filters, pick a different date, or upload a new dataset." />;
  }

  // Compute left offsets for frozen columns so they stack correctly.
  let runningLeft = 0;
  const frozenOffsets = new Map<string, number>();
  COLUMNS.forEach((col) => {
    if (FROZEN_KEYS.has(col.key)) {
      frozenOffsets.set(col.key, runningLeft);
      runningLeft += 100; // approx column width used for sticky offset math
    }
  });

  return (
    <div className="rounded-lg border border-line">
      <div className="overflow-auto max-h-[75vh]">
        <table className="w-full min-w-[1700px]">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const frozen = FROZEN_KEYS.has(col.key);
                return (
                  <th
                    key={col.key}
                    style={frozen ? { left: frozenOffsets.get(col.key), position: 'sticky', top: 0, zIndex: 30 } : { position: 'sticky', top: 0, zIndex: 20 }}
                    className={`table-th whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-text transition-colors' : ''} ${frozen ? 'bg-panel3' : 'bg-panel3'}`}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const globalIndex = (page - 1) * limit + i + 1;
              return (
              <tr
                key={row._id}
                className={`transition-colors ${i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'} ${row.isOver25h ? 'ring-1 ring-red/10' : ''} hover:bg-panel2`}
              >
                {COLUMNS.map((col) => {
                  const frozen = FROZEN_KEYS.has(col.key);
                  return (
                    <td
                      key={col.key}
                      style={frozen ? { left: frozenOffsets.get(col.key), position: 'sticky', zIndex: 10 } : undefined}
                      className={`table-td whitespace-nowrap ${frozen ? (i % 2 === 0 ? 'bg-bg' : 'bg-panel') : ''}`}
                    >
                      {col.key === 'srNo'
                        ? globalIndex
                        : col.render
                          ? col.render(row, i)
                          : <span className="text-xs text-muted font-mono">{String((row as unknown as Record<string, unknown>)[col.key] ?? '—')}</span>
                      }
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-panel px-3 py-3">
        <span className="text-[10px] text-muted">
          {fmtNum((page - 1) * limit + 1)}–{fmtNum(Math.min(page * limit, total))} of {fmtNum(total)} records
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onPage?.(page - 1)} disabled={page <= 1} className="btn-ghost p-1.5 disabled:opacity-30">
            <ChevronLeft size={13} />
          </button>
          <span className="px-2 text-xs text-muted font-mono">{page}/{totalPages}</span>
          <button onClick={() => onPage?.(page + 1)} disabled={page >= totalPages} className="btn-ghost p-1.5 disabled:opacity-30">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}