import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import AlertsTableRow from './AlertsTableRow';
import type { VehicleRecord } from '@/types';

const HEADERS = [
  'Sr. No', 'Document No', 'Warehouse', 'End Customer', 'Container No',
  'Transporter', 'Vehicle No', 'WLL IN', 'WLL OUT', 'Duration',
  'Detention Reason', 'Other Reason', 'Load Type',
];

interface Props {
  rows: VehicleRecord[];
  loading?: boolean;
}

function AlertsTable({ rows, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No detention cases found"
        message="All loads are within the 25-hour threshold for the selected filters."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => <AlertsTableRow key={r._id} row={r} index={i} />)}
        </tbody>
      </table>
    </div>
  );
}

export default memo(AlertsTable);