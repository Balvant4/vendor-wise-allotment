import { memo } from 'react';
import Badge from '@/components/shared/Badge';
import { severityFromHours } from '@/components/shared/StatusBadge';
import { fmtDateTime, fmtHours } from '@/lib/utils';
import type { VehicleRecord } from '@/types';

interface Props {
  row: VehicleRecord;
  index: number;
}

function AlertsTableRow({ row: r, index: i }: Props) {
  const severity = severityFromHours(r.diffHours);

  return (
    <tr className={`transition-colors animate-fade-up ${i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'} hover:bg-panel2`}>
      <td className="table-td font-mono">{i + 1}</td>
      <td className="table-td font-mono">{r.documentNumber || '—'}</td>
      <td className="table-td">{r.division}</td>
      <td className="table-td truncate max-w-[140px]">{r.customerName || r.endCustName || '—'}</td>
      <td className="table-td font-mono">{r.containerNo}</td>
      <td className="table-td">{r.transporter}</td>
      <td className="table-td font-mono font-semibold text-text">{r.vehicleNo}</td>
      <td className="table-td whitespace-nowrap">{fmtDateTime(r.wllWeighIn)}</td>
      <td className="table-td whitespace-nowrap">{fmtDateTime(r.wllWeighOut)}</td>
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
}

export default memo(AlertsTableRow);