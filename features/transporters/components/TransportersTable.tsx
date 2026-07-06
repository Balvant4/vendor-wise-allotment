'use client';
import { Archive, Pencil, RotateCcw, Trash2, Truck } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import type { TransporterMapping } from '../types';
import { TRANSPORTERS_PAGE_SIZE } from '../types';

const TABLE_HEADERS = ['#', 'Original Name (SAP)', 'Standard Name', 'Type', 'Actions'];

interface TransportersTableProps {
  transporters: TransporterMapping[];
  isLoading: boolean;
  showDeleted: boolean;
  page: number;
  total: number;
  totalPages: number;
  restoring: boolean;
  onEdit: (t: TransporterMapping) => void;
  onDeleteRequest: (id: string) => void;
  onRestore: (id: string) => void;
  onPageChange: (page: number) => void;
}

export default function TransportersTable({
  transporters,
  isLoading,
  showDeleted,
  page,
  total,
  totalPages,
  restoring,
  onEdit,
  onDeleteRequest,
  onRestore,
  onPageChange,
}: TransportersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-10 rounded" />
        ))}
      </div>
    );
  }

  if (transporters.length === 0) {
    return (
      <EmptyState
        icon={showDeleted ? Archive : Truck}
        title={showDeleted ? 'No deleted mappings' : 'No mappings found'}
        message={showDeleted ? 'Nothing has been deleted yet.' : 'Add your first transporter mapping using the button above.'}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {TABLE_HEADERS.map((h) => (
                <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transporters.map((t, i) => (
              <tr
                key={t._id}
                className={`transition-colors hover:bg-panel2 ${
                  t.needsReview ? 'bg-red/5 ring-1 ring-red/10' : i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'
                }`}
              >
                <td className="table-td text-[10px] text-muted2 font-mono w-8">
                  {(page - 1) * TRANSPORTERS_PAGE_SIZE + i + 1}
                </td>

                <td className="table-td">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gold bg-gold/5 px-2 py-0.5 rounded border border-gold/10">
                      {t.originalName}
                    </span>
                    {t.needsReview && (
                      <span title="Auto-added from upload — needs your review" className="text-red text-xs">⚠</span>
                    )}
                  </div>
                </td>

                <td className="table-td">
                  {t.needsReview ? (
                    <span className="text-xs text-muted2 italic">Not set yet — click edit</span>
                  ) : (
                    <span className="text-xs font-semibold text-text">{t.standardName}</span>
                  )}
                </td>

                <td className="table-td">
                  <Badge variant={t.isFix ? 'blue' : 'gold'}>{t.isFix ? 'FIX' : 'NON FIX'}</Badge>
                </td>

                <td className="table-td">
                  <div className="flex items-center gap-1">
                    {showDeleted ? (
                      <button
                        onClick={() => onRestore(t._id)}
                        disabled={restoring}
                        className="btn-ghost flex items-center gap-1 px-2 py-1 text-[10px] hover:text-green hover:border-green/30"
                        title="Restore this mapping"
                      >
                        <RotateCcw size={11} /> Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(t)}
                          className="btn-ghost p-1.5 hover:text-gold hover:border-gold/30"
                          title="Edit"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => onDeleteRequest(t._id)}
                          className="btn-ghost p-1.5 hover:text-red hover:border-red/30"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[10px] text-muted">{total} total mappings</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-ghost px-2 py-1 text-xs disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="px-2 text-xs text-muted font-mono">{page}/{totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost px-2 py-1 text-xs disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
