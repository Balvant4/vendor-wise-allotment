'use client';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import { Truck } from 'lucide-react';
import { fmtDate, fmtHours, fmtNum } from '@/lib/utils';
import type { VehicleRecord } from '@/types';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: VehicleRecord) => React.ReactNode;
}

const COLUMNS: Column[] = [
  { key: 'vehicleNo',    label: 'Vehicle No',   sortable: true },
  { key: 'containerNo',  label: 'Container',    sortable: true },
  { key: 'transporter',  label: 'Transporter',  sortable: true },
  { key: 'division',     label: 'Division',     sortable: true },
  { key: 'customerName', label: 'Customer' },
  {
    key: 'isFix', label: 'Load Type',
    render: (r) => <Badge variant={r.isFix ? 'blue' : 'gray'}>{r.isFix ? 'Fix' : 'Non-Fix'}</Badge>,
  },
  {
    key: 'isMapped', label: 'Mapped',
    render: (r) => r.isMapped
      ? <Badge variant="green">Yes</Badge>
      : <Badge variant="gold">No</Badge>,
  },
  {
    key: 'diffHours', label: 'Duration', sortable: true,
    render: (r) => r.hasIncompleteData
      ? <span className="text-muted2 text-xs italic">—</span>
      : (
        <span className={`font-mono text-xs font-semibold ${r.isOver25h ? 'text-red' : 'text-green'}`}>
          {fmtHours(r.diffHours)}
        </span>
      ),
  },
  {
    key: 'isOver25h', label: '>25H',
    render: (r) => r.hasIncompleteData
      ? <Badge variant="gray">N/A</Badge>
      : r.isOver25h
        ? <Badge variant="red">Alert</Badge>
        : <Badge variant="green">OK</Badge>,
  },
  {
    key: 'wllWeighIn', label: 'Date', sortable: true,
    render: (r) => <span className="text-muted text-xs">{fmtDate(r.wllWeighIn)}</span>,
  },
];

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
  showPagination?: boolean;
}

export default function VehicleTable({
  data, loading, total, page, limit,
  sortKey, sortDir, onSort, onPage,
  showPagination = true,
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
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-9 rounded" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState icon={Truck} title="No records found" message="Adjust your filters or upload a new dataset." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`table-th first:rounded-tl-lg last:rounded-tr-lg ${col.sortable ? 'cursor-pointer select-none hover:text-text transition-colors' : ''}`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row._id}
              className={`transition-colors ${i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'} ${row.isOver25h ? 'ring-1 ring-red/10' : ''} hover:bg-panel2`}
            >
              {COLUMNS.map((col) => (
               <td key={col.key} className="table-td">
                  {col.render
                    ? col.render(row)
                    : <span className="text-xs text-muted font-mono">{String((row as unknown as Record<string, unknown>)[col.key] ?? '—')}</span>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {showPagination && (
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[10px] text-muted">
            {fmtNum((page - 1) * limit + 1)}–{fmtNum(Math.min(page * limit, total))} of {fmtNum(total)} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage?.(page - 1)}
              disabled={page <= 1}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-2 text-xs text-muted font-mono">{page}/{totalPages}</span>
            <button
              onClick={() => onPage?.(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
