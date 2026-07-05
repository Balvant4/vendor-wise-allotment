import { memo } from 'react';
import { Repeat } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import { fmtHours } from '@/lib/utils';
import type { RepeatVehicle } from '../types';

interface Props {
  repeatVehicles: [string, RepeatVehicle][];
  loading?: boolean;
}

function RepeatVehiclesPanel({ repeatVehicles, loading }: Props) {
  return (
    <div className="panel-card">
      <div className="mb-3 flex items-center gap-2">
        <Repeat size={14} className="text-red" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Repeat Vehicles</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
        </div>
      ) : repeatVehicles.length === 0 ? (
        <p className="text-xs text-muted2 italic">No vehicle detained more than once in this range.</p>
      ) : (
        <div className="space-y-2">
          {repeatVehicles.map(([vehicleNo, v]) => (
            <div key={vehicleNo} className="flex items-center justify-between text-xs">
              <div className="min-w-0">
                <div className="font-mono font-semibold text-text truncate">{vehicleNo}</div>
                <div className="text-[10px] text-muted2 truncate">{v.transporter}</div>
              </div>
              <Badge variant="red" className="shrink-0 text-[10px]">{v.count}× · {fmtHours(v.hours)}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(RepeatVehiclesPanel);